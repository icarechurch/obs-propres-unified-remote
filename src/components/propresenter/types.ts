import type { ActivePresentationSlide } from '@/services/propresenter.service'

export interface ActivePres {
  name: string
  currentSlide: number
  totalSlides: number
  uuid: string
  slides: ActivePresentationSlide[]
}

export type ProPresenterTab =
  | 'slides'
  | 'clear'
  | 'macros'
  | 'timers'
  | 'transport'
