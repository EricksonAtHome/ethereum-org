package com.erikbank.core.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TransactionResponse(
        UUID id,
        String paymentRef,
        String payeeName,
        long amountCents,
        String currency,
        String method,
        String bankCode,
        String status,
        BigDecimal fraudScore,
        String complianceStatus,
        String routingChannel,
        Instant createdAt,
        Instant completedAt
) {}
