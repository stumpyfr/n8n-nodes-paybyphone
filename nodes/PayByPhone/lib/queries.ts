export const QUERIES = {
	GET_PARKING_SESSIONS: `
		query GetParkingSessionsV1($input: GetParkingSessionsInput!) {
			getParkingSessionsV1(input: $input) {
				parkingSessionId
				status
				statusDetail
				type
				locationId
				startTime
				stall
				expireTime
				stopTime
				isStoppable
				fpsApplies
				isExtendable
				isRenewable
				renewableAfter
				maxStayState
				vehicle {
					id
					legacyVehicleId
					licensePlate
					countryCode
					type
					jurisdiction
					__typename
				}
				ratePolicy {
					ratePolicyId
					type
					__typename
				}
				totalCost {
					amount
					currency
					__typename
				}
				segments {
					parkingSegmentId
					parkingStart
					parkingEnd
					cost
					fees
					chargeableTimeUnitsParked
					chargeableTimeUnitType
					freeTimeUnitsApplied
					freeTimeUnitType
					isFreedayExtension
					isCredit
					status
					statusDetail
					failureReason
					parkingReferenceId
					jobLineItemId
					feesApplied {
						fees {
							name
							cost {
								amount
								currency
								__typename
							}
							__typename
						}
						total {
							amount
							currency
							__typename
						}
						__typename
					}
					__typename
				}
				feesApplied {
					fees {
						name
						cost {
							amount
							currency
							__typename
						}
						__typename
					}
					total {
						amount
						currency
						__typename
					}
					__typename
				}
				couponApplied {
					couponId
					appliedDate
					maxRedemptionValue {
						amount
						currency
						__typename
					}
					redeemedAmount {
						amount
						currency
						__typename
					}
					oldTotalSessionCost {
						amount
						currency
						__typename
					}
					newTotalSessionCost {
						amount
						currency
						__typename
					}
					__typename
				}
				jobId
				__typename
			}
			__typename
		}
	`,

	START_PARKING_SESSION: `
		mutation StartParkingSessionV1($input: StartParkingSessionV1Input!) {
			startParkingSessionV1(input: $input) {
				parkingSessionResponse {
					parkingSessionId
					expireTime
					isEarlyCapture
					segmentTotalCost {
						amount
						currency
						__typename
					}
					metadata
					__typename
				}
				__typename
			}
			__typename
		}
	`,

	CREATE_JOB: `
		mutation CreateJobV1($input: CreateJobV1Input!) {
			createJobV1(input: $input) {
				createJobResponse {
					jobId
					__typename
				}
				__typename
			}
			__typename
		}
	`,

	GET_JOB: `
		query GetJobV1($jobId: UUID!) {
			getJobV1(jobId: $jobId) {
				jobId
				status
				captureGroups {
					captureGroupId
					stage
					status
					closedAt
					authentication {
						hiddenIframe
						challengeHtml
						token
						__typename
					}
					lineItems {
						itemId
						productReferenceId
						status
						metadata
						amount {
							value
							isoCurrencyCode
							__typename
						}
						executionDetails {
							isFailure
							code
							message
							metadata
							__typename
						}
						__typename
					}
					couponAmount {
						value
						isoCurrencyCode
						__typename
					}
					couponDetails {
						status {
							code
							status
							message
							__typename
						}
						couponId
						redeemedAt
						requestedAt
						totalAmountRedeemed {
							value
							isoCurrencyCode
							__typename
						}
						__typename
					}
					executionDetails {
						isFailure
						code
						message
						metadata
						captureGroupStage
						__typename
					}
					__typename
				}
				executionDetails {
					isFailure
					code
					message
					metadata
					__typename
				}
				__typename
			}
			__typename
		}
	`,

	GET_RATE_OPTIONS: `
		query GetRateOptionsV1($input: GetRateOptionsInput!) {
			getRateOptionsV1(input: $input) {
				name
				type
				ratePolicyId
				maxStayStatus
				maxStayEndTime
				effectiveMaxStayDuration {
					quantity
					timeUnit
					__typename
				}
				acceptedTimeUnits
				areas
				eligibilityEndDate
				parkingNotAllowedReason
				restrictionPeriods {
					startTime
					endTime
					maxStay {
						quantity
						timeUnit
						__typename
					}
					__typename
				}
				renewalParking {
					isAllowed
					window {
						unit
						quantity
						__typename
					}
					__typename
				}
				fps {
					id
					active
					validityTime
					__typename
				}
				profile {
					profileName
					icon {
						iconId
						iconImage
						iconMimeType
						__typename
					}
					userMessages {
						locale
						message
						__typename
					}
					__typename
				}
				availablePromotions {
					id
					cost {
						amount
						currency
						__typename
					}
					duration
					configuredDuration
					usage
					displayName
					__typename
				}
				timeSteps {
					quantity
					timeUnit
					__typename
				}
				vehicleRegistrationFound
				__typename
			}
			__typename
		}
	`,

	CREATE_QUOTES: `
		mutation CreateQuotesV1($requests: [QuoteRequestInput!]!) {
			createQuotesV1(input: {requests: $requests}) {
				createQuotesResponse {
					totalCost {
						amount
						currency
						__typename
					}
					quotes {
						quoteId
						quoteRequestId
						cost {
							amount
							currency
							__typename
						}
						details {
							quoteId
							locationId
							stall
							quoteDate
							parkingStartTime
							parkingExpiryTime
							parkingDurationAdjustment
							licensePlate
							corporateAccountSmsOverride
							corporateAccountSmsConfirmationOverride
							corporateAccountSmsReminderOverride
							promotionApplied {
								id
								cost {
									amount
									currency
									__typename
								}
								duration {
									quantity
									timeUnit
									__typename
								}
								displayName
								usage
								isSelectedByUser
								isTimeSplit
								isExternal
								configuredDuration {
									quantity
									timeUnit
									__typename
								}
								minimumIncrement {
									quantity
									timeUnit
									__typename
								}
								__typename
							}
							totalCost {
								amount
								currency
								__typename
							}
							quoteItems {
								quoteItemType
								name
								costAmount {
									amount
									currency
									__typename
								}
								subQuoteItems {
									quoteItemType
									name
									costAmount {
										amount
										currency
										__typename
									}
									__typename
								}
								__typename
							}
							__typename
						}
						product
						__typename
					}
					quoteErrors {
						quoteRequestId
						product
						status
						reason
						__typename
					}
					__typename
				}
				__typename
			}
			__typename
		}
	`,
};
