package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	_ "github.com/lib/pq"
)

type WwftPayerData struct {
	FullName          string `json:"fullName"`
	DateOfBirth       string `json:"dateOfBirth"`
	Nationality       string `json:"nationality"`
	Email             string `json:"email"`
	Phone             string `json:"phone"`
	IDDocumentType    string `json:"idDocumentType"`
	IDDocumentNumber  string `json:"idDocumentNumber"`
	AddressStreet     string `json:"addressStreet"`
	AddressCity       string `json:"addressCity"`
	AddressPostalCode string `json:"addressPostalCode"`
	AddressCountry    string `json:"addressCountry"`
	PaymentPurpose    string `json:"paymentPurpose"`
	ClientIP          string `json:"clientIp"`
	UserAgent         string `json:"userAgent"`
	ChainType         int    `json:"chainType"`
}

type WwftRecord struct {
	PaymentRef       string
	MerchantOrderSN  string
	Payer            WwftPayerData
	USDTAddress      string
	PayUSDT          float64
	QRImageURL       string
	USDTOrderStatus  int
	ExchangeRate     float64
	ExpiresAt        *time.Time
	RawGateway       json.RawMessage
}

var db *sql.DB

func initDatabase() error {
	connURL := env("DATABASE_URL", "postgresql://erikbank:erikbank@postgres:5432/erikbank?sslmode=disable")
	var err error
	db, err = sql.Open("postgres", connURL)
	if err != nil {
		return err
	}
	db.SetMaxOpenConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return db.PingContext(ctx)
}

func validateWwft(data WwftPayerData) error {
	required := map[string]string{
		"fullName":          data.FullName,
		"dateOfBirth":       data.DateOfBirth,
		"nationality":       data.Nationality,
		"email":             data.Email,
		"phone":             data.Phone,
		"idDocumentType":    data.IDDocumentType,
		"idDocumentNumber":  data.IDDocumentNumber,
		"addressStreet":     data.AddressStreet,
		"addressCity":       data.AddressCity,
		"addressPostalCode": data.AddressPostalCode,
		"addressCountry":    data.AddressCountry,
		"paymentPurpose":    data.PaymentPurpose,
	}
	for field, value := range required {
		if strings.TrimSpace(value) == "" {
			return fmt.Errorf("wwft field %s is required", field)
		}
	}
	if data.ChainType != 1 && data.ChainType != 2 {
		return fmt.Errorf("chainType must be 1 (TRC20) or 2 (ERC20)")
	}
	return nil
}

func saveWwftRecord(record WwftRecord) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := db.ExecContext(ctx, `
		INSERT INTO wwft_payer_records (
			payment_ref, merchant_order_sn, full_name, date_of_birth, nationality,
			email, phone, id_document_type, id_document_number,
			address_street, address_city, address_postal_code, address_country,
			payment_purpose, client_ip, user_agent, chain_type,
			usdt_address, pay_usdt, qr_image_url, usdt_order_status,
			exchange_rate, expires_at, raw_gateway_response
		) VALUES (
			$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24
		)
	`,
		record.PaymentRef,
		record.MerchantOrderSN,
		record.Payer.FullName,
		record.Payer.DateOfBirth,
		record.Payer.Nationality,
		record.Payer.Email,
		record.Payer.Phone,
		record.Payer.IDDocumentType,
		record.Payer.IDDocumentNumber,
		record.Payer.AddressStreet,
		record.Payer.AddressCity,
		record.Payer.AddressPostalCode,
		record.Payer.AddressCountry,
		record.Payer.PaymentPurpose,
		nullString(record.Payer.ClientIP),
		nullString(record.Payer.UserAgent),
		record.Payer.ChainType,
		nullString(record.USDTAddress),
		record.PayUSDT,
		nullString(record.QRImageURL),
		record.USDTOrderStatus,
		record.ExchangeRate,
		record.ExpiresAt,
		record.RawGateway,
	)
	return err
}

func updateWwftOrderStatus(merchantOrderSN string, status int, paidAt *time.Time) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := db.ExecContext(ctx, `
		UPDATE wwft_payer_records
		SET usdt_order_status = $1, paid_at = $2, updated_at = NOW()
		WHERE merchant_order_sn = $3
	`, status, paidAt, merchantOrderSN)
	return err
}

func getWwftByPaymentRef(paymentRef string) (*WwftRecord, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	row := db.QueryRowContext(ctx, `
		SELECT payment_ref, merchant_order_sn, full_name, date_of_birth, nationality,
		       email, phone, id_document_type, id_document_number,
		       address_street, address_city, address_postal_code, address_country,
		       payment_purpose, COALESCE(host(client_ip)::text, ''), COALESCE(user_agent, ''),
		       chain_type, COALESCE(usdt_address, ''), COALESCE(pay_usdt, 0),
		       COALESCE(qr_image_url, ''), usdt_order_status, COALESCE(exchange_rate, 0),
		       expires_at
		FROM wwft_payer_records
		WHERE payment_ref = $1
	`, paymentRef)

	var record WwftRecord
	var clientIP, userAgent string
	err := row.Scan(
		&record.PaymentRef,
		&record.MerchantOrderSN,
		&record.Payer.FullName,
		&record.Payer.DateOfBirth,
		&record.Payer.Nationality,
		&record.Payer.Email,
		&record.Payer.Phone,
		&record.Payer.IDDocumentType,
		&record.Payer.IDDocumentNumber,
		&record.Payer.AddressStreet,
		&record.Payer.AddressCity,
		&record.Payer.AddressPostalCode,
		&record.Payer.AddressCountry,
		&record.Payer.PaymentPurpose,
		&clientIP,
		&userAgent,
		&record.Payer.ChainType,
		&record.USDTAddress,
		&record.PayUSDT,
		&record.QRImageURL,
		&record.USDTOrderStatus,
		&record.ExchangeRate,
		&record.ExpiresAt,
	)
	if err != nil {
		return nil, err
	}
	record.Payer.ClientIP = clientIP
	record.Payer.UserAgent = userAgent
	return &record, nil
}

func nullString(value string) sql.NullString {
	if strings.TrimSpace(value) == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: value, Valid: true}
}

func auditWwft(paymentRef string, payload any) {
	if db == nil {
		return
	}
	body, err := json.Marshal(payload)
	if err != nil {
		log.Printf("wwft audit marshal error: %v", err)
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	_, err = db.ExecContext(ctx, `
		INSERT INTO audit_events (payment_ref, service_name, event_type, payload)
		VALUES ($1, 'payment-router', 'wwft_saved', $2)
	`, paymentRef, body)
	if err != nil {
		log.Printf("wwft audit insert error: %v", err)
	}
}
