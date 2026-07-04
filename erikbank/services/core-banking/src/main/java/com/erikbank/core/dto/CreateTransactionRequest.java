package com.erikbank.core.dto;

import java.math.BigDecimal;

public record CreateTransactionRequest(
        String paymentRef,
        String payeeName,
        long amountCents,
        String currency,
        String method,
        String bankCode,
        BigDecimal fraudScore,
        String complianceStatus,
        String routingChannel,
        String status
) {}
