package main

import (
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"
)

type UPayClient struct {
	BaseURL   string
	AppID     string
	AppSecret string
	HTTP      *http.Client
}

type UPayOrderRequest struct {
	OrderSN     string
	PayMoney    string
	ProductName string
	PayUsername string
	ProductDesc string
	ChainType   int
	MoneyType   int
	NotifyURL   string
	CallbackURL string
	Attach      string
}

type UPayOrderResult struct {
	AppID        string  `json:"appid"`
	OrderSN      string  `json:"order_sn"`
	PayUSDT      float64 `json:"pay_usdt"`
	Address      string  `json:"address"`
	Img          string  `json:"img"`
	ChainType    int     `json:"chain_type"`
	ExchangeRate float64 `json:"exchange_rate"`
	TimeOut      int64   `json:"time_out"`
	Signature    string  `json:"signature"`
}

type UPaySearchResult struct {
	AppID      string  `json:"appid"`
	PayUSDT    float64 `json:"pay_usdt"`
	PayMoney   string  `json:"pay_money"`
	OrderSN    string  `json:"order_sn"`
	Attach     string  `json:"attach"`
	Status     int     `json:"status"`
	SuccessTime int64  `json:"success_time"`
	Signature  string  `json:"signature"`
}

type upayResponse struct {
	Code int             `json:"code"`
	Msg  string          `json:"msg"`
	Data json.RawMessage `json:"data"`
}

func newUPayClient() *UPayClient {
	return &UPayClient{
		BaseURL:   strings.TrimRight(env("UPAY_GATEWAY_URL", "http://usdt-gateway:80"), "/"),
		AppID:     env("UPAY_APP_ID", "ciofh5fe"),
		AppSecret: env("UPAY_APP_SECRET", "ed696eb5bba1f7460585cc6975e6cf9bf24903dd"),
		HTTP:      &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *UPayClient) CreateOrder(req UPayOrderRequest) (*UPayOrderResult, error) {
	params := map[string]string{
		"appid":        c.AppID,
		"order_sn":     req.OrderSN,
		"pay_money":    req.PayMoney,
		"product_name": req.ProductName,
		"pay_username": req.PayUsername,
		"product_desc": req.ProductDesc,
		"product_num":  "1",
		"attach":       req.Attach,
		"notify_url":   req.NotifyURL,
		"callback_url": req.CallbackURL,
		"chain_type":   fmt.Sprintf("%d", req.ChainType),
		"money_type":   fmt.Sprintf("%d", req.MoneyType),
	}
	params["signature"] = upaySignature(params, c.AppSecret)

	body, err := c.postForm("/api/pay/unifiedorder", params)
	if err != nil {
		return nil, err
	}

	var envelope upayResponse
	if err := json.Unmarshal(body, &envelope); err != nil {
		return nil, err
	}
	if envelope.Code != 1 {
		return nil, fmt.Errorf("upay order failed: %s", envelope.Msg)
	}

	var result UPayOrderResult
	if err := json.Unmarshal(envelope.Data, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

func (c *UPayClient) SearchOrder(orderSN string) (*UPaySearchResult, error) {
	params := map[string]string{
		"appid":    c.AppID,
		"order_sn": orderSN,
	}
	params["signature"] = upaySignature(params, c.AppSecret)

	body, err := c.postForm("/api/pay/search", params)
	if err != nil {
		return nil, err
	}

	var envelope upayResponse
	if err := json.Unmarshal(body, &envelope); err != nil {
		return nil, err
	}
	if envelope.Code != 1 {
		return nil, fmt.Errorf("upay search failed: %s", envelope.Msg)
	}

	var result UPaySearchResult
	if err := json.Unmarshal(envelope.Data, &result); err != nil {
		return nil, err
	}
	return &result, nil
}

func (c *UPayClient) postForm(path string, params map[string]string) ([]byte, error) {
	form := url.Values{}
	for key, value := range params {
		form.Set(key, value)
	}

	resp, err := c.HTTP.Post(c.BaseURL+path, "application/x-www-form-urlencoded", strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 300 {
		return nil, fmt.Errorf("upay http %d: %s", resp.StatusCode, string(body))
	}
	return body, nil
}

func upaySignature(params map[string]string, appsecret string) string {
	keys := make([]string, 0, len(params))
	for key, value := range params {
		if key == "signature" || value == "" {
			continue
		}
		keys = append(keys, key)
	}
	sort.Strings(keys)

	pairs := make([]string, 0, len(keys))
	for _, key := range keys {
		pairs = append(pairs, url.QueryEscape(key)+"="+url.QueryEscape(params[key]))
	}
	query := strings.Join(pairs, "&")
	decoded := phpURLDecode(query)
	signInput := decoded + "&appsecret=" + appsecret
	sum := md5.Sum([]byte(signInput))
	return strings.ToUpper(hex.EncodeToString(sum[:]))
}

func phpURLDecode(encoded string) string {
	replaced := strings.ReplaceAll(encoded, "+", " ")
	decoded, err := url.QueryUnescape(replaced)
	if err != nil {
		return replaced
	}
	return decoded
}

func verifyUPaySignature(params map[string]string, appsecret string) bool {
	expected := upaySignature(params, appsecret)
	return strings.EqualFold(expected, params["signature"])
}
