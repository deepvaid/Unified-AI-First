<script setup lang="ts">
/**
 * SmsPhonePreview — the live phone mock beside the SMS composers.
 * One component; CreateSmsCampaign and CreateTransactionalSms previously
 * carried ~20 duplicated declarations each.
 *
 * The geometry below is a deliberate raw-px exemption (same class as
 * PosPreview): it draws a phone, not app chrome, so its bezel, notch and
 * bubble radii follow the device illustration rather than the token scale.
 */
defineProps<{
  /** The sender line at the top of the thread (a number or an alphanumeric sender ID). */
  sender: string
  /** The message exactly as the customer would receive it. */
  message: string
}>()
</script>

<template>
  <div class="sms-phone">
    <div class="sms-phone__notch" />
    <div class="sms-phone__sender">{{ sender }}</div>
    <div class="sms-phone__thread">
      <div class="sms-phone__bubble">{{ message }}</div>
      <div class="sms-phone__stamp">Delivered · now</div>
    </div>
  </div>
</template>

<style scoped>
.sms-phone {
  background: linear-gradient(180deg, rgba(var(--v-theme-on-surface), 0.04), rgba(var(--v-theme-on-surface), 0.02));
  border: 1px solid var(--mp-border-subtle);
  border-radius: 22px;
  padding: 18px 14px 20px;
}
.sms-phone__notch {
  width: 42px;
  height: 5px;
  border-radius: var(--mp-radius-full);
  background: rgba(var(--v-theme-on-surface), 0.18);
  margin: 0 auto 14px;
}
.sms-phone__sender {
  text-align: center;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: rgba(var(--v-theme-on-surface), 0.55);
  margin-bottom: 12px;
}
.sms-phone__thread {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.sms-phone__bubble {
  max-width: 100%;
  background: rgb(var(--v-theme-surface));
  border: 1px solid var(--mp-border-subtle);
  border-radius: 16px 16px 16px 4px;
  padding: 10px 13px;
  font-size: 0.8125rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}
.sms-phone__stamp {
  font-size: 0.625rem;
  color: rgba(var(--v-theme-on-surface), 0.45);
  margin-top: 4px;
  padding-left: 4px;
}
</style>
