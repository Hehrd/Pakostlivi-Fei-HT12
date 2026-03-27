package com.mischievous.fairies.service;

import com.mischievous.fairies.controller.dtos.request.payment.PaymentDetailsReqDto;
import com.mischievous.fairies.persistence.model.RestaurantEntity;
import com.mischievous.fairies.persistence.model.StripeAccountEntity;
import com.mischievous.fairies.persistence.repository.RestaurantRepository;
import com.mischievous.fairies.persistence.repository.StripeAccountRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Account;
import com.stripe.model.PaymentIntent;
import com.stripe.param.AccountCreateParams;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class StripeService {

    private static final long MIN_AMOUNT = 1L;
    private static final long MUNCHMAN_CUT_PERCENTAGE = 5L;

    private final StripeAccountRepository stripeAccountRepository;

    public StripeService(@Value("${stripe.secret-key}") String stripeSecretKey, StripeAccountRepository stripeAccountRepository) {
        this.stripeAccountRepository = stripeAccountRepository;
        Stripe.apiKey = stripeSecretKey;
    }

    public String createPaymentIntent(PaymentDetailsReqDto paymentDetails) throws StripeException {
        validateAmount(paymentDetails);
        StripeAccountEntity stripeAccountEntity = stripeAccountRepository.findByRestaurant_Id(paymentDetails.getRestaurantId());
        long amount = paymentDetails.getAmount();
        long platformFee = calculatePlatformFee(amount);

        PaymentIntentCreateParams params =
                PaymentIntentCreateParams.builder()
                        .setAmount(amount)
                        .setCurrency("eur")
                        .setApplicationFeeAmount(platformFee)
                        .setAutomaticPaymentMethods(
                                PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                        .setEnabled(true)
                                        .build()
                        )
                        .setTransferData(
                                PaymentIntentCreateParams.TransferData.builder()
                                        .setDestination(stripeAccountEntity.getStripeAccountId())
                                        .build()
                        )
                        .build();

        PaymentIntent paymentIntent = PaymentIntent.create(params);
        return paymentIntent.getClientSecret();
    }

    public String createBusinessAccount(String email) throws StripeException {
        AccountCreateParams params = AccountCreateParams.builder()
                .setCountry("BG")
                .setEmail(email)
                .build();

        Account account = Account.create(params);
        return account.getId();
    }


    private void validateAmount(PaymentDetailsReqDto paymentDetails) {
        if (paymentDetails == null) {
            throw new IllegalArgumentException("Payment details cannot be null.");
        }

        if (paymentDetails.getAmount() < MIN_AMOUNT) {
            throw new IllegalArgumentException("Amount must be greater than 0.");
        }
    }

    private long calculatePlatformFee(long amount) {
        return (amount * MUNCHMAN_CUT_PERCENTAGE) / 100;
    }
}