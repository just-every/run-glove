# Postmark webhook reading

Retrieved 8 November 2026 from the public provider documentation:

- https://postmarkapp.com/developer/webhooks/bounce-webhook
- https://postmarkapp.com/developer/webhooks/delivery-webhook
- https://postmarkapp.com/developer/webhooks/spam-complaint-webhook

The bounce documentation states: "Inactive — Lets you know if this bounce caused the email address to be deactivated." It defines CanActivate as whether that address can be activated again. Its soft-bounce TypeCode 4096 guidance says to check Inactive for deactivation and CanActivate for reactivation.

Delivery uses Recipient, DeliveredAt and Metadata. SpamComplaint uses Email and BouncedAt for the complaint occurrence. The fixture preserves the Glove delivery metadata and the actual provider field names.

The current mapping of SoftBounce with Inactive true to failed is consistent with this deactivation reading. CanActivate is not a delivery retry or finality signal. No normalization change was made. This records the provider-reported status only and makes no live delivery or provider-account claim.
