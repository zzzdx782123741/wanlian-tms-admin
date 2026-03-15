const PHONE_REGEX = /^1[3-9]\d{9}$/
const ID_CARD_REGEX = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[0-9Xx]$/
const CREDIT_CODE_REGEX = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i
const BUSINESS_LICENSE_NUMBER_REGEX = /^(?:\d{15}|[0-9A-HJ-NPQRTUWXY]{18})$/i
const BANK_ACCOUNT_NUMBER_REGEX = /^\d{8,30}$/

export function trimValue(value) {
  if (value === undefined || value === null) {
    return ''
  }

  return String(value).trim()
}

export function compactValue(value) {
  return trimValue(value).replace(/\s+/g, '')
}

function uppercaseCompactValue(value) {
  return compactValue(value).toUpperCase()
}

export function normalizePhone(value) {
  return compactValue(value)
}

export function normalizeIdCard(value) {
  return uppercaseCompactValue(value)
}

export function normalizeCreditCode(value) {
  return uppercaseCompactValue(value)
}

export function normalizeVin(value) {
  return uppercaseCompactValue(value)
}

export function normalizeBusinessLicenseNumber(value) {
  return uppercaseCompactValue(value)
}

export function normalizeBankAccountNumber(value) {
  return compactValue(value)
}

export function isValidPhone(value) {
  const normalizedValue = normalizePhone(value)
  return Boolean(normalizedValue) && PHONE_REGEX.test(normalizedValue)
}

export function isValidIdCard(value) {
  const normalizedValue = normalizeIdCard(value)
  return Boolean(normalizedValue) && ID_CARD_REGEX.test(normalizedValue)
}

export function isValidCreditCode(value) {
  const normalizedValue = normalizeCreditCode(value)
  return Boolean(normalizedValue) && CREDIT_CODE_REGEX.test(normalizedValue)
}

export function isValidVin(value) {
  const normalizedValue = normalizeVin(value)
  return Boolean(normalizedValue) && VIN_REGEX.test(normalizedValue)
}

export function isValidBusinessLicenseNumber(value) {
  const normalizedValue = normalizeBusinessLicenseNumber(value)
  return Boolean(normalizedValue) && BUSINESS_LICENSE_NUMBER_REGEX.test(normalizedValue)
}

export function isValidBankAccountNumber(value) {
  const normalizedValue = normalizeBankAccountNumber(value)
  return Boolean(normalizedValue) && BANK_ACCOUNT_NUMBER_REGEX.test(normalizedValue)
}

function buildRequiredRule(message) {
  return {
    required: true,
    message,
    trigger: 'blur'
  }
}

function createValidator({ normalize, validate, invalidMessage, allowEmpty = false }) {
  return (_rule, value, callback) => {
    const normalizedValue = normalize(value)

    if (!normalizedValue) {
      if (allowEmpty) {
        callback()
        return
      }

      callback(new Error(invalidMessage))
      return
    }

    if (!validate(normalizedValue)) {
      callback(new Error(invalidMessage))
      return
    }

    callback()
  }
}

export function buildPhoneRules(options = {}) {
  const {
    required = true,
    requiredMessage = '请输入手机号',
    invalidMessage = '请输入正确的手机号'
  } = options

  const rules = []
  if (required) {
    rules.push(buildRequiredRule(requiredMessage))
  }

  rules.push({
    validator: createValidator({
      normalize: normalizePhone,
      validate: isValidPhone,
      invalidMessage,
      allowEmpty: !required
    }),
    trigger: 'blur'
  })

  return rules
}

export function buildIdCardRules(options = {}) {
  const {
    required = true,
    requiredMessage = '请输入身份证号',
    invalidMessage = '请输入正确的身份证号'
  } = options

  const rules = []
  if (required) {
    rules.push(buildRequiredRule(requiredMessage))
  }

  rules.push({
    validator: createValidator({
      normalize: normalizeIdCard,
      validate: isValidIdCard,
      invalidMessage,
      allowEmpty: !required
    }),
    trigger: 'blur'
  })

  return rules
}

export function buildCreditCodeRules(options = {}) {
  const {
    required = true,
    requiredMessage = '请输入统一社会信用代码',
    invalidMessage = '请输入正确的统一社会信用代码'
  } = options

  const rules = []
  if (required) {
    rules.push(buildRequiredRule(requiredMessage))
  }

  rules.push({
    validator: createValidator({
      normalize: normalizeCreditCode,
      validate: isValidCreditCode,
      invalidMessage,
      allowEmpty: !required
    }),
    trigger: 'blur'
  })

  return rules
}

export function buildVinRules(options = {}) {
  const {
    required = true,
    requiredMessage = '请输入车架号（VIN）',
    invalidMessage = '请输入正确的 17 位车架号（VIN）'
  } = options

  const rules = []
  if (required) {
    rules.push(buildRequiredRule(requiredMessage))
  }

  rules.push({
    validator: createValidator({
      normalize: normalizeVin,
      validate: isValidVin,
      invalidMessage,
      allowEmpty: !required
    }),
    trigger: 'blur'
  })

  return rules
}

export function buildBusinessLicenseNumberRules(options = {}) {
  const {
    required = true,
    requiredMessage = '请输入营业执照号',
    invalidMessage = '请输入正确的营业执照号'
  } = options

  const rules = []
  if (required) {
    rules.push(buildRequiredRule(requiredMessage))
  }

  rules.push({
    validator: createValidator({
      normalize: normalizeBusinessLicenseNumber,
      validate: isValidBusinessLicenseNumber,
      invalidMessage,
      allowEmpty: !required
    }),
    trigger: 'blur'
  })

  return rules
}

export function buildBankAccountNumberRules(options = {}) {
  const {
    required = true,
    requiredMessage = '请输入银行账号',
    invalidMessage = '请输入正确的银行账号'
  } = options

  const rules = []
  if (required) {
    rules.push(buildRequiredRule(requiredMessage))
  }

  rules.push({
    validator: createValidator({
      normalize: normalizeBankAccountNumber,
      validate: isValidBankAccountNumber,
      invalidMessage,
      allowEmpty: !required
    }),
    trigger: 'blur'
  })

  return rules
}
