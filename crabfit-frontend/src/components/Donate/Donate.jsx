import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '/src/components'
import { useTWAStore } from '/src/stores'

import {
  Wrapper,
  Options,
} from './Donate.styles'

import paypal_logo from '/src/res/paypal.svg'

const PAYMENT_METHOD = 'https://play.google.com/billing'
const SKU = 'crab_donation'

const Donate = () => {
  const store = useTWAStore()
  const { t } = useTranslation('common')

  const firstLinkRef = useRef()
  const modalRef = useRef()
  const [isOpen, _setIsOpen] = useState(false)
  const [closed, setClosed] = useState(false)

  const setIsOpen = open => {
    _setIsOpen(open)

    if (open) {
      window.setTimeout(() => firstLinkRef.current.focus(), 150)
    }
  }

  const linkPressed = () => {
    setIsOpen(false)
    gtag('event', 'donate', { 'event_category': 'donate' })
  }

  useEffect(() => {
    if (store.TWA === undefined) {
      store.setTWA(document.referrer.includes('android-app://fit.crab'))
    }
  }, [store])

  const acknowledge = async (token, type='repeatable', onComplete = () => {}) => {
    try {
      const service = await window.getDigitalGoodsService(PAYMENT_METHOD)
      await service.acknowledge(token, type)
      if ('acknowledge' in service) {
        // DGAPI 1.0
        service.acknowledge(token, type)
      } else {
        // DGAPI 2.0
        service.consume(token)
      }
      onComplete()
    } catch (error) {
      console.error(error)
    }
  }

  const purchase = () => {
    if (!window.PaymentRequest) return false
    if (!window.getDigitalGoodsService) return false

    const supportedInstruments = [{
      supportedMethods: PAYMENT_METHOD,
      data: {
        sku: SKU
      }
    }]

    const details = {
      total: {
        label: 'Total',
        amount: { currency: 'AUD', value: '0' }
      },
    }

    const request = new PaymentRequest(supportedInstruments, details)

    request.show()
      .then(response => {
        response
          .complete('success')
          .then(() => {
            console.log(`Payment done: ${JSON.stringify(response, undefined, 2)}`)
            if (response.details && response.details.token) {
              const token = response.details.token
              console.log(`Read Token: ${token.substring(0, 6)}...`)
              alert(t('donate.messages.success'))
              acknowledge(token)
            }
          })
          .catch(e => {
            console.error(e.message)
            alert(t('donate.messages.error'))
          })
      })
      .catch(e => {
        console.error(e)
        alert(t('donate.messages.error'))
      })
  }

  return (
    <Wrapper>
      <Button
        small
        title={t('donate.title')}
        onClick={event => {
          if (closed) {
            event.preventDefault()
            return setClosed(false)
          }
          if (store.TWA) {
            gtag('event', 'donate', { 'event_category': 'donate' })
            event.preventDefault()
            if (window.confirm(t('donate.messages.about'))) {
              if (purchase() === false) {
                alert(t('donate.messages.error'))
              }
            }
          } else {
            event.preventDefault()
            setIsOpen(true)
          }
        }}
        href="https://www.paypal.com/donate?business=N89X6YXRT5HKW&item_name=Crab+Fit+Donation&currency_code=AUD&amount=5"
        target="_blank"
        rel="noreferrer noopener payment"
        id="donate_button"
        role="button"
        aria-expanded={isOpen ? 'true' : 'false'}
        style={{ whiteSpace: 'nowrap' }}
      >{t('donate.button')}</Button>

      <Options
        $isOpen={isOpen}
        ref={modalRef}
        onBlur={e => {
          if (modalRef.current?.contains(e.relatedTarget)) return
          setIsOpen(false)
          if (e.relatedTarget && e.relatedTarget.id === 'donate_button') {
            setClosed(true)
          }
        }}
      >
        <img src={paypal_logo} alt="Donate with PayPal" />
        <a onClick={linkPressed} ref={firstLinkRef} href="https://www.paypal.com/donate?business=N89X6YXRT5HKW&item_name=Crab+Fit+Donation&currency_code=AUD&amount=2" target="_blank" rel="noreferrer noopener payment">{t('donate.options.$2')}</a>
        <a onClick={linkPressed} href="https://www.paypal.com/donate?business=N89X6YXRT5HKW&item_name=Crab+Fit+Donation&currency_code=AUD&amount=5" target="_blank" rel="noreferrer noopener payment"><strong>{t('donate.options.$5')}</strong></a>
        <a onClick={linkPressed} href="https://www.paypal.com/donate?business=N89X6YXRT5HKW&item_name=Crab+Fit+Donation&currency_code=AUD&amount=10" target="_blank" rel="noreferrer noopener payment">{t('donate.options.$10')}</a>
        <a onClick={linkPressed} href="https://www.paypal.com/donate?business=N89X6YXRT5HKW&item_name=Crab+Fit+Donation&currency_code=AUD" target="_blank" rel="noreferrer noopener payment">{t('donate.options.choose')}</a>
      </Options>
    </Wrapper>
  )
}

export default Donate
