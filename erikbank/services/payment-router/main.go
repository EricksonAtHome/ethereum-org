package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

type BankOption struct {
	Code string `json:"code"`
	Name string `json:"name"`
}

type PaymentRequest struct {
	PayeeName  string `json:"payeeName"`
	AmountCents int64  `json:"amountCents"`
	Currency   string `json:"currency"`
	Method     string `json:"method"`
	BankCode   string `json:"bankCode"`
}

type PaymentResponse struct {
	PaymentRef        string  `json:"paymentRef"`
	Status            string  `json:"status"`
	PayeeName         string  `json:"payeeName"`
	AmountCents       int64   `json:"amountCents"`
	Currency          string  `json:"currency"`
	Method            string  `json:"method"`
	BankCode          string  `json:"bankCode"`
	BankName          string  `json:"bankName"`
	FraudScore        float64 `json:"fraudScore"`
	ComplianceStatus  string  `json:"complianceStatus"`
	RoutingChannel    string  `json:"routingChannel"`
	QRPayload         string  `json:"qrPayload"`
	Message           string  `json:"message"`
}

var bankCatalog = map[string][]BankOption{
	"erikbank": {
		{Code: "ERIKBANK", Name: "ErikBank"},
		{Code: "DANSKE", Name: "Danske Bank"},
		{Code: "NORDEA", Name: "Nordea"},
		{Code: "SEB", Name: "SEB"},
	},
	"ideal": {
		{Code: "ING", Name: "ING"},
		{Code: "RABO", Name: "Rabobank"},
		{Code: "ABN", Name: "ABN AMRO"},
		{Code: "BUNQ", Name: "bunq"},
	},
	"wero": {
		{Code: "BNP", Name: "BNP Paribas"},
		{Code: "DEUTSCHE", Name: "Deutsche Bank"},
		{Code: "SOCIETE", Name: "Société Générale"},
		{Code: "BBVA", Name: "BBVA"},
	},
}

func main() {
	port := env("PORT", "8082")
	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", withCORS(healthHandler))
	mux.HandleFunc("/api/banks", withCORS(banksHandler))
	mux.HandleFunc("/api/payments", withCORS(paymentsHandler))
	mux.HandleFunc("/api/payments/", withCORS(paymentStatusHandler))

	log.Printf("payment-router (Go) listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next(w, r)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"service":  "payment-router",
		"language": "go",
		"status":   "ok",
	})
}

func banksHandler(w http.ResponseWriter, r *http.Request) {
	method := strings.ToLower(r.URL.Query().Get("method"))
	if method == "" {
		method = "erikbank"
	}
	banks, ok := bankCatalog[method]
	if !ok {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "unknown method"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"method": method, "banks": banks})
}

func paymentsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req PaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid json"})
		return
	}

	if req.AmountCents <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "amount must be positive"})
		return
	}
	if req.Currency == "" {
		req.Currency = "EUR"
	}
	if req.Method == "" {
		req.Method = "erikbank"
	}
	if req.BankCode == "" {
		req.BankCode = defaultBankCode(req.Method)
	}

	paymentRef := fmt.Sprintf("PMT-%d", time.Now().UnixNano())
	bankName := lookupBankName(req.Method, req.BankCode)

	fraudScore, err := callFraudScore(req)
	if err != nil {
		log.Printf("fraud service error: %v", err)
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "fraud service unavailable"})
		return
	}
	if fraudScore >= 0.85 {
		writeJSON(w, http.StatusForbidden, map[string]any{
			"paymentRef": paymentRef,
			"status":     "blocked",
			"message":    "Payment blocked by fraud analytics",
			"fraudScore": fraudScore,
		})
		return
	}

	complianceStatus, err := callCompliance(paymentRef, req)
	if err != nil {
		log.Printf("enterprise service error: %v", err)
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "enterprise service unavailable"})
		return
	}
	if complianceStatus != "approved" {
		writeJSON(w, http.StatusForbidden, map[string]any{
			"paymentRef":       paymentRef,
			"status":           "rejected",
			"complianceStatus": complianceStatus,
			"message":          "Payment rejected by compliance",
		})
		return
	}

	routingChannel := routeChannel(req.Method, req.BankCode)
	txPayload := map[string]any{
		"paymentRef":        paymentRef,
		"payeeName":         req.PayeeName,
		"amountCents":       req.AmountCents,
		"currency":          req.Currency,
		"method":            req.Method,
		"bankCode":          req.BankCode,
		"fraudScore":        fraudScore,
		"complianceStatus":  complianceStatus,
		"routingChannel":    routingChannel,
	}

	if err := callCoreBanking(txPayload); err != nil {
		log.Printf("core banking error: %v", err)
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "core banking unavailable"})
		return
	}

	resp := PaymentResponse{
		PaymentRef:       paymentRef,
		Status:           "completed",
		PayeeName:        req.PayeeName,
		AmountCents:      req.AmountCents,
		Currency:         req.Currency,
		Method:           req.Method,
		BankCode:         req.BankCode,
		BankName:         bankName,
		FraudScore:       fraudScore,
		ComplianceStatus: complianceStatus,
		RoutingChannel:   routingChannel,
		QRPayload:        fmt.Sprintf("erikbank://pay/%s?amount=%d&currency=%s", paymentRef, req.AmountCents, req.Currency),
		Message:          fmt.Sprintf("Payment routed via %s to %s", routingChannel, bankName),
	}
	writeJSON(w, http.StatusOK, resp)
}

func paymentStatusHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	ref := strings.TrimPrefix(r.URL.Path, "/api/payments/")
	if ref == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "payment ref required"})
		return
	}

	coreURL := env("CORE_BANKING_URL", "http://localhost:8081")
	resp, err := http.Get(coreURL + "/api/transactions/" + ref)
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "core banking unavailable"})
		return
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	_, _ = w.Write(body)
}

func callFraudScore(req PaymentRequest) (float64, error) {
	url := env("FRAUD_URL", "http://localhost:8084") + "/api/score"
	payload, _ := json.Marshal(map[string]any{
		"payeeName":   req.PayeeName,
		"amountCents": req.AmountCents,
		"method":      req.Method,
		"bankCode":    req.BankCode,
	})
	resp, err := http.Post(url, "application/json", bytes.NewReader(payload))
	if err != nil {
		return 1, err
	}
	defer resp.Body.Close()
	var result struct {
		Score float64 `json:"score"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 1, err
	}
	return result.Score, nil
}

func callCompliance(paymentRef string, req PaymentRequest) (string, error) {
	url := env("ENTERPRISE_URL", "http://localhost:8083") + "/api/compliance/validate"
	payload, _ := json.Marshal(map[string]any{
		"paymentRef":  paymentRef,
		"payeeName":   req.PayeeName,
		"amountCents": req.AmountCents,
		"currency":    req.Currency,
		"method":      req.Method,
	})
	resp, err := http.Post(url, "application/json", bytes.NewReader(payload))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	var result struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	return result.Status, nil
}

func callCoreBanking(payload map[string]any) error {
	url := env("CORE_BANKING_URL", "http://localhost:8081") + "/api/transactions"
	body, _ := json.Marshal(payload)
	resp, err := http.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("core banking status %d: %s", resp.StatusCode, string(b))
	}
	return nil
}

func routeChannel(method, bankCode string) string {
	switch strings.ToLower(method) {
	case "ideal":
		return "IDEAL-NL"
	case "wero":
		return "WERO-EU"
	default:
		return "ERIKBANK-SEPA"
	}
}

func defaultBankCode(method string) string {
	switch strings.ToLower(method) {
	case "ideal":
		return "ING"
	case "wero":
		return "BNP"
	default:
		return "ERIKBANK"
	}
}

func lookupBankName(method, code string) string {
	for _, bank := range bankCatalog[strings.ToLower(method)] {
		if bank.Code == code {
			return bank.Name
		}
	}
	return code
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
