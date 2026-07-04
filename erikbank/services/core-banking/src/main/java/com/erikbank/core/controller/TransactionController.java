package com.erikbank.core.controller;

import com.erikbank.core.dto.CreateTransactionRequest;
import com.erikbank.core.dto.TransactionResponse;
import com.erikbank.core.dto.UpdateTransactionStatusRequest;
import com.erikbank.core.service.TransactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class TransactionController {
    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("service", "core-banking", "language", "java", "status", "ok");
    }

    @PostMapping("/transactions")
    public ResponseEntity<TransactionResponse> create(@RequestBody CreateTransactionRequest request) {
        return ResponseEntity.ok(transactionService.createTransaction(request));
    }

    @PatchMapping("/transactions/status")
    public ResponseEntity<TransactionResponse> updateStatus(@RequestBody UpdateTransactionStatusRequest request) {
        return ResponseEntity.ok(transactionService.updateStatus(request));
    }

    @GetMapping("/transactions/{paymentRef}")
    public ResponseEntity<TransactionResponse> get(@PathVariable String paymentRef) {
        return transactionService.findByPaymentRef(paymentRef)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/accounts/demo/balance")
    public Map<String, Object> demoBalance() {
        return Map.of(
                "accountId", "a1111111-1111-4111-8111-111111111111",
                "balanceCents", transactionService.getDemoBalanceCents(),
                "currency", "EUR"
        );
    }
}
