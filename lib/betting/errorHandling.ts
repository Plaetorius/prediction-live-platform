import { betTxErrorMessages } from "../errors"

export interface ErrorAnalysisResult {
  errorCode?: string
  userMessage: string
  shouldUpdateBetStatus: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function analyzeTransactionError(error: any): ErrorAnalysisResult {
  let errorCode: string | undefined

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasCause = (error: any): error is { cause: any } =>
    error && typeof error === "object" && 'cause' in error

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasData = (obj: any): obj is { data: any } => 
    obj && typeof obj === 'object' && 'data' in obj

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasCode = (obj: any): obj is { code: any } => 
    obj && typeof obj === 'object' && 'code' in obj && typeof obj.code === 'number'

  // If this is a structured object (not common)
  if (hasCause(error)) {
    if (hasData(error.cause) && hasCode(error.cause.data)) {
      errorCode = error.cause.data.code.toString()
    } else if (hasCode(error.cause)) {
      errorCode = error.cause.code.toString()
    }
  }

  // If this is string of a structured object
  if (!errorCode) {
    const errorMessage =
      (hasCause(error) && 'shortMessage' in error.cause ? error.cause.shortMessage : '') ||
      (hasCause(error) && 'message' in error.cause ? error.cause.message : '') ||
      ('message' in error ? error.message : '') ||
      ''
    
    const dataCodeMatch = errorMessage.match(/"data":\s*\{[^}]*"code":\s*(-?\d+)/)
    if (dataCodeMatch) {
      errorCode = dataCodeMatch[1]
    } else {
      const codeMatch = errorMessage.match(/"code":\s*(-?\d+)/)
      if (codeMatch) {
        errorCode = codeMatch[1]
      }
    }
  }

  const  userMessage = betTxErrorMessages[errorCode || ''] || "An unknown error occured"
  return {
    errorCode,
    userMessage,
    shouldUpdateBetStatus: true
  }
}