<script setup lang="ts">
import MpPageHeader from '@/components/MpPageHeader.vue'
import MpComingSoonTiles, { type ComingSoonTile } from '@/components/MpComingSoonTiles.vue'

const categories: ComingSoonTile[] = [
  { icon: 'credit-card',    title: 'Payment terminals', desc: 'Stripe Reader M2, S700, Tap to Pay on iPhone & Android.' },
  { icon: 'printer',        title: 'Receipt printers',  desc: 'Star Micronics mC-Print3, Epson TM-m30III, ESC/POS over Wi-Fi.' },
  { icon: 'scan-barcode',   title: 'Barcode scanners',  desc: 'Built-in camera or Bluetooth HID scanners (Socket Mobile S700/S800).' },
  { icon: 'archive',        title: 'Cash drawers',      desc: 'Printer-driven over RJ12 — auto-trigger on cash sales.' },
]
</script>

<template>
  <div class="h-100 d-flex flex-column gap-5">
    <MpPageHeader
      title="Hardware"
      subtitle="Configure peripherals paired to your registers — terminals, printers, scanners, and cash drawers."
    />

    <MpComingSoonTiles
      icon="printer"
      title="Hardware management coming soon"
      description="Hardware pairing lives on the POS device itself today. This panel will surface paired devices, firmware versions, and troubleshooting tools for your fleet."
      :tiles="categories"
    />
  </div>
</template>
