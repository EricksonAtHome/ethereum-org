package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

type BankOption struct {
	Code string `json:"code"`
	Name string `json:"name"`
}

type PaymentRequest struct {
	PayeeName         string       `json:"payeeName"`
	AmountCents       int64        `json:"amountCents"`
	Currency          string       `json:"currency"`
	Method            string       `json:"method"`
	BankCode          string       `json:"bankCode"`
	Wwft              WwftPayerData `json:"wwft"`
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
	MerchantOrderSN   string  `json:"merchantOrderSn,omitempty"`
	PayUSDT           float64 `json:"payUsdt,omitempty"`
	USDTAddress       string  `json:"usdtAddress,omitempty"`
	QRImageURL        string  `json:"qrImageUrl,omitempty"`
	ChainType         int     `json:"chainType,omitempty"`
	ChainLabel        string  `json:"chainLabel,omitempty"`
	ExchangeRate      float64 `json:"exchangeRate,omitempty"`
	ExpiresAt         int64   `json:"expiresAt,omitempty"`
	USDTOrderStatus   int     `json:"usdtOrderStatus,omitempty"`
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
	if err := initDatabase(); err != nil {
		log.Printf("database unavailable (WWFT storage disabled): %v", err)
	}

	port := env("PORT", "8082")
	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", withCORS(healthHandler))
	mux.HandleFunc("/api/banks", withCORS(banksHandler))
	mux.HandleFunc("/api/payments", withCORS(paymentsHandler))
	mux.HandleFunc("/api/payments/", withCORS(paymentSubHandler))
	mux.HandleFunc("/api/usdt/notify", withCORS(usdtNotifyHandler))
	mux.HandleFunc("/api/usdt/rate", withCORS(usdtRateHandler))

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
		"usdt":     env("UPAY_GATEWAY_URL", "http://usdt-gateway:80"),
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

func paymentSubHandler(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/payments/")
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) == 0 || parts[0] == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "payment ref required"})
		return
	}
	ref := parts[0]

	if len(parts) == 2 && parts[1] == "usdt" {
		usdtStatusHandler(w, r, ref)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
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
		req.Currency = "USDT"
	}
	if req.Method == "" {
		req.Method = "erikbank"
	}
	if req.BankCode == "" {
		req.BankCode = defaultBankCode(req.Method)
	}
	if req.Wwft.ChainType == 0 {
		req.Wwft.ChainType = 1
	}
	if req.Wwft.ClientIP == "" {
		req.Wwft.ClientIP = clientIP(r)
	}
	if req.Wwft.UserAgent == "" {
		req.Wwft.UserAgent = r.UserAgent()
	}

	if err := validateWwft(req.Wwft); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}
	if db == nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "WWFT database unavailable"})
		return
	}

	paymentRef := fmt.Sprintf("PMT-%d", time.Now().UnixNano())
	merchantOrderSN := fmt.Sprintf("EB-%d", time.Now().UnixNano())
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

	payMoney := fmt.Sprintf("%.2f", float64(req.AmountCents)/100.0)
	notifyURL := env("UPAY_NOTIFY_URL", "http://payment-router:8082/api/usdt/notify")
	callbackURL := env("UPAY_CALLBACK_URL", "http://frontend:8085/pay/"+req.Method)

	upay := newUPayClient()
	order, err := upay.CreateOrder(UPayOrderRequest{
		OrderSN:     merchantOrderSN,
		PayMoney:    payMoney,
		ProductName: fmt.Sprintf("%s payment to %s", req.Method, req.PayeeName),
		PayUsername: req.Wwft.FullName,
		ProductDesc: req.Wwft.PaymentPurpose,
		ChainType:   req.Wwft.ChainType,
		MoneyType:   1,
		NotifyURL:   notifyURL,
		CallbackURL: callbackURL,
		Attach:      paymentRef,
	})
	if err != nil {
		log.Printf("upay order error: %v", err)
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "USDT gateway unavailable: " + err.Error()})
		return
	}
	order.Img = upayPublicURL(order.Img)

	rawGateway, _ := json.Marshal(order)
	var expiresAt *time.Time
	if order.TimeOut > 0 {
		t := time.Unix(order.TimeOut, 0)
		expiresAt = &t
	}

	wwftRecord := WwftRecord{
		PaymentRef:      paymentRef,
		MerchantOrderSN: merchantOrderSN,
		Payer:           req.Wwft,
		USDTAddress:     order.Address,
		PayUSDT:         order.PayUSDT,
		QRImageURL:      order.Img,
		USDTOrderStatus: 0,
		ExchangeRate:    order.ExchangeRate,
		ExpiresAt:       expiresAt,
		RawGateway:      rawGateway,
	}
	if err := saveWwftRecord(wwftRecord); err != nil {
		log.Printf("wwft save error: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to store WWFT record"})
		return
	}
	auditWwft(paymentRef, wwftRecord)

	routingChannel := routeChannel(req.Method, req.BankCode)
	txPayload := map[string]any{
		"paymentRef":       paymentRef,
		"payeeName":        req.PayeeName,
		"amountCents":      req.AmountCents,
		"currency":         req.Currency,
		"method":           req.Method,
		"bankCode":         req.BankCode,
		"fraudScore":       fraudScore,
		"complianceStatus": complianceStatus,
		"routingChannel":   routingChannel,
		"status":           "awaiting_usdt",
	}

	if err := callCoreBanking(txPayload); err != nil {
		log.Printf("core banking error: %v", err)
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "core banking unavailable"})
		return
	}

	chainLabel := "TRC20"
	if req.Wwft.ChainType == 2 {
		chainLabel = "ERC20"
	}

	resp := PaymentResponse{
		PaymentRef:       paymentRef,
		Status:           "awaiting_usdt",
		PayeeName:        req.PayeeName,
		AmountCents:      req.AmountCents,
		Currency:         req.Currency,
		Method:           req.Method,
		BankCode:         req.BankCode,
		BankName:         bankName,
		FraudScore:       fraudScore,
		ComplianceStatus: complianceStatus,
		RoutingChannel:   routingChannel,
		QRPayload:        fmt.Sprintf("%s:%s?amount=%.2f", chainLabel, order.Address, order.PayUSDT),
		Message:          fmt.Sprintf("Send %.2f USDT on %s to complete payment", order.PayUSDT, chainLabel),
		MerchantOrderSN:  merchantOrderSN,
		PayUSDT:          order.PayUSDT,
		USDTAddress:      order.Address,
		QRImageURL:       order.Img,
		ChainType:        req.Wwft.ChainType,
		ChainLabel:       chainLabel,
		ExchangeRate:     order.ExchangeRate,
		ExpiresAt:        order.TimeOut,
		USDTOrderStatus:  0,
	}
	writeJSON(w, http.StatusOK, resp)
}

func usdtStatusHandler(w http.ResponseWriter, r *http.Request, paymentRef string) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if db == nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "database unavailable"})
		return
	}

	record, err := getWwftByPaymentRef(paymentRef)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "payment not found"})
		return
	}

	upay := newUPayClient()
	search, err := upay.SearchOrder(record.MerchantOrderSN)
	if err != nil {
		log.Printf("upay search error: %v", err)
		writeJSON(w, http.StatusOK, map[string]any{
			"paymentRef":      paymentRef,
			"merchantOrderSn": record.MerchantOrderSN,
			"usdtOrderStatus": record.USDTOrderStatus,
			"payUsdt":         record.PayUSDT,
			"usdtAddress":     record.USDTAddress,
			"status":          "awaiting_usdt",
			"message":         "Waiting for USDT transfer",
		})
		return
	}

	status := "awaiting_usdt"
	var paidAt *time.Time
	if search.Status == 1 {
		status = "completed"
		t := time.Unix(search.SuccessTime, 0)
		paidAt = &t
		_ = updateWwftOrderStatus(record.MerchantOrderSN, search.Status, paidAt)
		_ = callCoreBanking(map[string]any{
			"paymentRef": paymentRef,
			"status":     "completed",
		})
	} else {
		_ = updateWwftOrderStatus(record.MerchantOrderSN, search.Status, nil)
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"paymentRef":      paymentRef,
		"merchantOrderSn": record.MerchantOrderSN,
		"usdtOrderStatus": search.Status,
		"payUsdt":         search.PayUSDT,
		"usdtAddress":     record.USDTAddress,
		"status":          status,
		"successTime":     search.SuccessTime,
	})
}

func usdtRateHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	upay := newUPayClient()
	rate, err := upay.GetExchangeRate()
	if err != nil {
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"currency": "USDT",
		"quote":    "CNY",
		"rate":     rate,
		"source":   "upay-live",
	})
}

func usdtNotifyHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if err := r.ParseForm(); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	params := map[string]string{}
	for key, values := range r.PostForm {
		if len(values) > 0 {
			params[key] = values[0]
		}
	}

	upay := newUPayClient()
	if !verifyUPaySignature(params, upay.AppSecret) {
		http.Error(w, "invalid signature", http.StatusForbidden)
		return
	}

	orderSN := params["order_sn"]
	status, _ := strconv.Atoi(params["status"])
	var paidAt *time.Time
	if status == 1 {
		if ts, err := strconv.ParseInt(params["success_time"], 10, 64); err == nil {
			t := time.Unix(ts, 0)
			paidAt = &t
		}
	}
	_ = updateWwftOrderStatus(orderSN, status, paidAt)

	if attach := params["attach"]; attach != "" && status == 1 {
		_ = callCoreBanking(map[string]any{
			"paymentRef": attach,
			"status":     "completed",
		})
	}

	w.Header().Set("Content-Type", "text/plain")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("OK"))
}

func clientIP(r *http.Request) string {
	if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
		parts := strings.Split(forwarded, ",")
		return strings.TrimSpace(parts[0])
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
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
	if status, ok := payload["status"].(string); ok && len(payload) <= 3 {
		return patchCoreBankingStatus(payload["paymentRef"].(string), status)
	}

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

func patchCoreBankingStatus(paymentRef, status string) error {
	url := env("CORE_BANKING_URL", "http://localhost:8081") + "/api/transactions/status"
	body, _ := json.Marshal(map[string]string{
		"paymentRef": paymentRef,
		"status":     status,
	})
	req, err := http.NewRequest(http.MethodPatch, url, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("core banking patch status %d: %s", resp.StatusCode, string(b))
	}
	return nil
}

func routeChannel(method, bankCode string) string {
	switch strings.ToLower(method) {
	case "ideal":
		return "IDEAL-USDT"
	case "wero":
		return "WERO-USDT"
	default:
		return "ERIKBANK-USDT"
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
