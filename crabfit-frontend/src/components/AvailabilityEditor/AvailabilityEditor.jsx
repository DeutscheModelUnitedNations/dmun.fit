import { useState, useRef, Fragment, Suspense, lazy } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import localeData from 'dayjs/plugin/localeData'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isBetween from 'dayjs/plugin/isBetween'
import dayjs_timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import { useLocaleUpdateStore } from '/src/stores'

import {
  Wrapper,
  ScrollWrapper,
  Container,
  Date,
  Times,
  DateLabel,
  DayLabel,
  Spacer,
  TimeLabels,
  TimeLabel,
  TimeSpace,
  StyledMain,
} from '/src/components/AvailabilityViewer/AvailabilityViewer.styles'
import { Time } from './AvailabilityEditor.styles'

import { _GoogleCalendar, _OutlookCalendar, Center } from '/src/components'
import { Loader } from '../Loading/Loading.styles'

const GoogleCalendar = lazy(() => _GoogleCalendar())
const OutlookCalendar = lazy(() => _OutlookCalendar())

dayjs.extend(localeData)
dayjs.extend(customParseFormat)
dayjs.extend(isBetween)
dayjs.extend(utc)
dayjs.extend(dayjs_timezone)

const AvailabilityEditor = ({
  times,
  timeLabels,
  dates,
  timezone,
  isSpecificDates,
  value = [],
  onChange,
}) => {
  const { t } = useTranslation('event')
  const locale = useLocaleUpdateStore(state => state.locale)

  const [selectingTimes, _setSelectingTimes] = useState([])
  const staticSelectingTimes = useRef([])
  const setSelectingTimes = newTimes => {
    staticSelectingTimes.current = newTimes
    _setSelectingTimes(newTimes)
  }

  const startPos = useRef({})
  const staticMode = useRef(null)
  const [mode, _setMode] = useState(staticMode.current)
  const setMode = newMode => {
    staticMode.current = newMode
    _setMode(newMode)
  }

  return (
    <>
      <StyledMain>
        <Center style={{textAlign: 'center'}}>{t('event:you.info')}</Center>
      </StyledMain>
      {isSpecificDates && (
        <StyledMain>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Suspense fallback={<Loader />}>
              <GoogleCalendar
                timeMin={dayjs(times[0], 'HHmm-DDMMYYYY').toISOString()}
                timeMax={dayjs(times[times.length-1], 'HHmm-DDMMYYYY').add(15, 'm').toISOString()}
                timeZone={timezone}
                onImport={busyArray => onChange(
                  times.filter(time => !busyArray.some(busy =>
                    dayjs(time, 'HHmm-DDMMYYYY').isBetween(busy.start, busy.end, null, '[)')
                  ))
                )}
              />
              <OutlookCalendar
                timeMin={dayjs(times[0], 'HHmm-DDMMYYYY').toISOString()}
                timeMax={dayjs(times[times.length-1], 'HHmm-DDMMYYYY').add(15, 'm').toISOString()}
                timeZone={timezone}
                onImport={busyArray => onChange(
                  times.filter(time => !busyArray.some(busy =>
                    dayjs(time, 'HHmm-DDMMYYYY').isBetween(dayjs.tz(busy.start.dateTime, busy.start.timeZone), dayjs.tz(busy.end.dateTime, busy.end.timeZone), null, '[)')
                  ))
                )}
              />
            </Suspense>
          </div>
        </StyledMain>
      )}

      <Wrapper locale={locale}>
        <ScrollWrapper>
          <Container>
            <TimeLabels>
              {!!timeLabels.length && timeLabels.map((label, i) =>
                <TimeSpace key={i}>
                  {label.label?.length !== '' && <TimeLabel>{label.label}</TimeLabel>}
                </TimeSpace>
              )}
            </TimeLabels>
            {dates.map((date, x) => {
              const parsedDate = isSpecificDates ? dayjs(date, 'DDMMYYYY') : dayjs().day(date)
              const last = dates.length === x+1 || (isSpecificDates ? dayjs(dates[x+1], 'DDMMYYYY') : dayjs().day(dates[x+1])).diff(parsedDate, 'day') > 1
              return (
                <Fragment key={x}>
                  <Date>
                    {isSpecificDates && <DateLabel>{parsedDate.format('MMM D')}</DateLabel>}
                    <DayLabel>{parsedDate.format('ddd')}</DayLabel>

                    <Times
                      $borderRight={last}
                      $borderLeft={x === 0 || (parsedDate).diff(isSpecificDates ? dayjs(dates[x-1], 'DDMMYYYY') : dayjs().day(dates[x-1]), 'day') > 1}
                    >
                      {timeLabels.map((timeLabel, y) => {
                        if (!timeLabel.time) return null
                        if (!times.includes(`${timeLabel.time}-${date}`)) {
                          return (
                            <TimeSpace key={x+y} className="timespace" title={t('event:greyed_times')} />
                          )
                        }
                        const time = `${timeLabel.time}-${date}`

                        return (
                          <Time
                            key={x+y}
                            $time={time}
                            className="time"
                            $selected={value.includes(time)}
                            $selecting={selectingTimes.includes(time)}
                            $mode={mode}
                            onPointerDown={e => {
                              e.preventDefault()
                              startPos.current = {x, y}
                              setMode(value.includes(time) ? 'remove' : 'add')
                              setSelectingTimes([time])
                              e.currentTarget.releasePointerCapture(e.pointerId)

                              document.addEventListener('pointerup', () => {
                                if (staticMode.current === 'add') {
                                  onChange([...value, ...staticSelectingTimes.current])
                                } else if (staticMode.current === 'remove') {
                                  onChange(value.filter(t => !staticSelectingTimes.current.includes(t)))
                                }
                                setMode(null)
                              }, { once: true })
                            }}
                            onPointerEnter={() => {
                              if (staticMode.current) {
                                const found = []
                                for (let cy = Math.min(startPos.current.y, y); cy < Math.max(startPos.current.y, y)+1; cy++) {
                                  for (let cx = Math.min(startPos.current.x, x); cx < Math.max(startPos.current.x, x)+1; cx++) {
                                    found.push({y: cy, x: cx})
                                  }
                                }
                                setSelectingTimes(found.filter(d => timeLabels[d.y].time?.length === 4).map(d => `${timeLabels[d.y].time}-${dates[d.x]}`))
                              }
                            }}
                          />
                        )
                      })}
                    </Times>
                  </Date>
                  {last && dates.length !== x+1 && (
                    <Spacer />
                  )}
                </Fragment>
              )
            })}
          </Container>
        </ScrollWrapper>
      </Wrapper>
    </>
  )
}

export default AvailabilityEditor
