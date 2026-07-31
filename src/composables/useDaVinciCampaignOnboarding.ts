// Compatibility bridge for older assistant surfaces. Product onboarding now owns
// campaign setup as one part of the broader Marketing path.
export {
  useDaVinciSetupOnboarding as useDaVinciCampaignOnboarding,
  type SetupOnboardingResponse as CampaignOnboardingResponse,
} from '@/composables/useDaVinciSetupOnboarding'
