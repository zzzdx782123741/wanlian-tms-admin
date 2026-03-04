import * as XLSX from 'xlsx'

/**
 * 导出数据到Excel
 * @param {Array} data - 要导出的数据数组
 * @param {Object} options - 配置选项
 * @param {String} options.filename - 文件名（不含扩展名）
 * @param {String} options.sheetName - 工作表名称
 * @param {Array} options.headers - 表头配置 [{key: '字段名', label: '显示名', width: 20}]
 */
export function exportToExcel(data, options = {}) {
  const {
    filename = '导出数据',
    sheetName = 'Sheet1',
    headers = []
  } = options

  if (!data || data.length === 0) {
    console.warn('导出数据为空')
    return
  }

  try {
    // 构建工作表数据
    const worksheetData = []

    // 添加表头
    if (headers.length > 0) {
      worksheetData.push(headers.map(h => h.label))
    }

    // 添加数据行
    data.forEach(row => {
      if (headers.length > 0) {
        // 使用headers配置提取字段
        const rowData = headers.map(h => {
          const value = row[h.key]
          // 格式化特殊字段
          if (h.formatter) {
            return h.formatter(value, row)
          }
          // 默认格式化
          if (h.key.includes('Amount') || h.key.includes('Balance') || h.key === 'amount') {
            return value != null ? (value / 100).toFixed(2) : ''
          }
          return value != null ? value : ''
        })
        worksheetData.push(rowData)
      } else {
        // 不使用headers配置，直接导出所有字段
        worksheetData.push(Object.values(row))
      }
    })

    // 创建工作表
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

    // 设置列宽
    if (headers.length > 0) {
      const colWidths = headers.map(h => ({ wch: h.width || 15 }))
      worksheet['!cols'] = colWidths
    }

    // 创建工作簿
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    // 生成文件名（带时间戳）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const fullFilename = `${filename}_${timestamp}.xlsx`

    // 导出文件
    XLSX.writeFile(workbook, fullFilename)

    return true
  } catch (error) {
    console.error('导出Excel失败:', error)
    return false
  }
}

/**
 * 导出充值记录
 * @param {Array} data - 充值记录数据
 * @param {String} filename - 文件名
 */
export function exportRechargeRecords(data, filename = '充值记录') {
  const headers = [
    { key: 'rechargeNo', label: '充值单号', width: 25 },
    { key: 'fleetName', label: '车队名称', width: 20 },
    { key: 'amount', label: '充值金额(元)', width: 15 },
    { key: 'remitterName', label: '汇款方', width: 20 },
    { key: 'transferDate', label: '打款日期', width: 15 },
    { key: 'status', label: '审核状态', width: 12, formatter: (val) => {
      const map = { 'pending': '待审核', 'approved': '已通过', 'rejected': '已驳回' }
      return map[val] || val
    }},
    { key: 'appliedAt', label: '申请时间', width: 20, formatter: (val) => {
      return val ? new Date(val).toLocaleString('zh-CN') : ''
    }},
    { key: 'remark', label: '备注', width: 30 }
  ]

  return exportToExcel(data, { filename, sheetName: '充值记录', headers })
}

/**
 * 导出提现记录
 * @param {Array} data - 提现记录数据
 * @param {String} filename - 文件名
 */
export function exportWithdrawalRecords(data, filename = '提现记录') {
  const headers = [
    { key: 'withdrawalNo', label: '提现单号', width: 25 },
    { key: 'storeName', label: '门店名称', width: 20 },
    { key: 'withdrawalAmount', label: '提现金额(元)', width: 15 },
    { key: 'platformFee', label: '平台手续费(元)', width: 18 },
    { key: 'orderCount', label: '订单数量', width: 12 },
    { key: 'status', label: '状态', width: 12, formatter: (val) => {
      const map = { 'pending': '待打款', 'processing': '处理中', 'completed': '已完成', 'rejected': '已驳回' }
      return map[val] || val
    }},
    { key: 'appliedAt', label: '申请时间', width: 20, formatter: (val) => {
      return val ? new Date(val).toLocaleString('zh-CN') : ''
    }},
    { key: 'processedAt', label: '打款时间', width: 20, formatter: (val) => {
      return val ? new Date(val).toLocaleString('zh-CN') : ''
    }},
    { key: 'remark', label: '备注', width: 30 }
  ]

  return exportToExcel(data, { filename, sheetName: '提现记录', headers })
}

/**
 * 导出收入记录
 * @param {Array} data - 收入记录数据
 * @param {String} filename - 文件名
 */
export function exportIncomeRecords(data, filename = '平台收入') {
  const headers = [
    { key: 'incomeNo', label: '收入单号', width: 25 },
    { key: 'orderNumber', label: '订单号', width: 20 },
    { key: 'fleetName', label: '车队名称', width: 20 },
    { key: 'storeName', label: '门店名称', width: 20 },
    { key: 'orderAmount', label: '订单金额(元)', width: 15 },
    { key: 'feeAmount', label: '平台手续费(元)', width: 18 },
    { key: 'settledAt', label: '结算时间', width: 20, formatter: (val) => {
      return val ? new Date(val).toLocaleString('zh-CN') : ''
    }}
  ]

  return exportToExcel(data, { filename, sheetName: '平台收入', headers })
}

/**
 * 导出交易记录
 * @param {Array} data - 交易记录数据
 * @param {String} filename - 文件名
 */
export function exportTransactionRecords(data, filename = '交易记录') {
  const headers = [
    { key: 'type', label: '交易类型', width: 12, formatter: (val) => {
      const map = {
        'recharge': '充值',
        'freeze': '冻结',
        'unfreeze': '解冻',
        'deduct': '扣除',
        'refund': '退款'
      }
      return map[val] || val
    }},
    { key: 'amount', label: '金额(元)', width: 15 },
    { key: 'balance', label: '余额(元)', width: 15 },
    { key: 'description', label: '说明', width: 30 },
    { key: 'createdAt', label: '交易时间', width: 20, formatter: (val) => {
      return val ? new Date(val).toLocaleString('zh-CN') : ''
    }}
  ]

  return exportToExcel(data, { filename, sheetName: '交易记录', headers })
}

export default {
  exportToExcel,
  exportRechargeRecords,
  exportWithdrawalRecords,
  exportIncomeRecords,
  exportTransactionRecords
}
