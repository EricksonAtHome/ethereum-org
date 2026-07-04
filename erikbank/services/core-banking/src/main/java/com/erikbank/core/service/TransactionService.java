package com.erikbank.core.service;

import com.erikbank.core.dto.CreateTransactionRequest;
import com.erikbank.core.dto.TransactionResponse;
import com.erikbank.core.dto.UpdateTransactionStatusRequest;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class TransactionService {
    private static final UUID DEFAULT_PAYER = UUID.fromString("a1111111-1111-4111-8111-111111111111");

    private final JdbcTemplate jdbc;

    private final RowMapper<TransactionResponse> mapper = (rs, rowNum) -> new TransactionResponse(
            UUID.fromString(rs.getString("id")),
            rs.getString("payment_ref"),
            rs.getString("payee_name"),
            rs.getLong("amount_cents"),
            rs.getString("currency"),
            rs.getString("method"),
            rs.getString("bank_code"),
            rs.getString("status"),
            rs.getBigDecimal("fraud_score"),
            rs.getString("compliance_status"),
            rs.getString("routing_channel"),
            rs.getTimestamp("created_at").toInstant(),
            rs.getTimestamp("completed_at") != null ? rs.getTimestamp("completed_at").toInstant() : null
    );

    public TransactionService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public TransactionResponse createTransaction(CreateTransactionRequest request) {
        UUID id = UUID.randomUUID();
        Instant now = Instant.now();
        String status = request.status() != null && !request.status().isBlank()
                ? request.status()
                : "processing";

        jdbc.update(
                """
                INSERT INTO transactions (
                    id, payment_ref, payer_account_id, payee_name, amount_cents, currency,
                    method, bank_code, status, fraud_score, compliance_status, routing_channel, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                id,
                request.paymentRef(),
                DEFAULT_PAYER,
                request.payeeName(),
                request.amountCents(),
                request.currency(),
                request.method(),
                request.bankCode(),
                status,
                request.fraudScore(),
                request.complianceStatus(),
                request.routingChannel(),
                Timestamp.from(now)
        );

        if ("awaiting_usdt".equals(status)) {
            return findByPaymentRef(request.paymentRef()).orElseThrow();
        }

        completeTransaction(request.paymentRef(), request.amountCents());
        return findByPaymentRef(request.paymentRef()).orElseThrow();
    }

    @Transactional
    public TransactionResponse updateStatus(UpdateTransactionStatusRequest request) {
        TransactionResponse existing = findByPaymentRef(request.paymentRef())
                .orElseThrow(() -> new IllegalArgumentException("transaction not found"));

        if ("completed".equals(request.status()) && !"completed".equals(existing.status())) {
            completeTransaction(request.paymentRef(), existing.amountCents());
        } else {
            jdbc.update(
                    "UPDATE transactions SET status = ? WHERE payment_ref = ?",
                    request.status(),
                    request.paymentRef()
            );
        }

        return findByPaymentRef(request.paymentRef()).orElseThrow();
    }

    private void completeTransaction(String paymentRef, long amountCents) {
        jdbc.update(
                "UPDATE accounts SET balance_cents = balance_cents - ? WHERE id = ? AND balance_cents >= ?",
                amountCents,
                DEFAULT_PAYER,
                amountCents
        );

        jdbc.update(
                """
                UPDATE transactions
                SET status = 'completed', completed_at = ?
                WHERE payment_ref = ?
                """,
                Timestamp.from(Instant.now()),
                paymentRef
        );
    }

    public Optional<TransactionResponse> findByPaymentRef(String paymentRef) {
        try {
            return Optional.ofNullable(jdbc.queryForObject(
                    "SELECT * FROM transactions WHERE payment_ref = ?",
                    mapper,
                    paymentRef
            ));
        } catch (EmptyResultDataAccessException ex) {
            return Optional.empty();
        }
    }

    public long getDemoBalanceCents() {
        Long balance = jdbc.queryForObject(
                "SELECT balance_cents FROM accounts WHERE id = ?",
                Long.class,
                DEFAULT_PAYER
        );
        return balance != null ? balance : 0L;
    }
}
