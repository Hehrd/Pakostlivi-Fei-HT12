"use client";

import { useState } from "react";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { getUserDisplayName } from "@/lib/auth-user";

const stripePublishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

const cardElementOptions = {
  style: {
    base: {
      color: "#173122",
      fontFamily: "var(--font-geist-sans), sans-serif",
      fontSize: "16px",
      "::placeholder": {
        color: "rgba(23, 49, 34, 0.45)",
      },
    },
    invalid: {
      color: "#b42318",
    },
  },
};

function PaymentForm({ checkout, user, onClose, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!stripe || !elements || isSubmitting) {
      return;
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setErrorMessage("The Stripe card form is still loading.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const result = await stripe.confirmCardPayment(checkout.clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: getUserDisplayName(user),
          email: user?.email ?? "",
        },
      },
    });

    if (result.error) {
      setErrorMessage(result.error.message || "Payment could not be completed.");
      setIsSubmitting(false);
      return;
    }

    await onSuccess(result.paymentIntent);
    setIsSubmitting(false);
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="rounded-[1.5rem] border border-border bg-surface-muted/65 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/55">
          Card details
        </p>
        <div className="mt-3 rounded-2xl border border-border bg-white px-4 py-4">
          <CardElement options={cardElementOptions} />
        </div>
        <p className="mt-3 text-xs leading-6 text-foreground/58">
          Test card: 4242 4242 4242 4242, expiry 12/34, CVC 696.
        </p>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary/35 hover:bg-primary-soft/35 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isSubmitting}
          className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-80"
        >
          {isSubmitting
            ? "Processing payment..."
            : `Pay EUR ${Number(checkout.foodSale?.price ?? 0).toFixed(2)}`}
        </button>
      </div>
    </form>
  );
}

export default function StripePaymentDialog({
  checkout,
  user,
  onClose,
  onSuccess,
}) {
  if (!checkout) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(11,24,17,0.55)] px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[2rem] border border-border/75 bg-white p-6 shadow-[0_28px_90px_rgba(17,51,34,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Stripe Checkout
            </p>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
              Pay for {checkout.foodSale?.title ?? "this food sale"}
            </h2>
            <p className="text-sm leading-7 text-foreground/66">
              Your reservation was created and is being held while you complete
              payment. Once Stripe confirms the payment, the reservation will be
              saved locally in your reservations view.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border bg-white px-3 py-2 text-xs font-semibold text-foreground/72 transition hover:border-primary/35 hover:bg-primary-soft/35"
          >
            Close
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.3rem] bg-primary-soft/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Restaurant
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {checkout.foodSale?.restaurantName ?? "Restaurant unavailable"}
            </p>
          </div>
          <div className="rounded-[1.3rem] bg-surface-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/55">
              Pickup
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {checkout.foodSale?.pickupWindow ?? "Unavailable"}
            </p>
          </div>
          <div className="rounded-[1.3rem] bg-surface-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/55">
              Reservation
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              #{checkout.reservation?.id ?? "Pending"}
            </p>
          </div>
        </div>

        <div className="mt-6">
          {!stripePromise ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-7 text-amber-900">
              Stripe is not ready on the frontend yet. Add
              `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to the frontend environment
              and reload the app.
            </div>
          ) : (
            <Elements stripe={stripePromise}>
              <PaymentForm
                checkout={checkout}
                user={user}
                onClose={onClose}
                onSuccess={onSuccess}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}
