import { promises as fs } from "fs"
import path from "path"
import sequelize from "../../config/database"
import { Region, Departement, Arrondissement, Cameroun } from "../../models"
import { logger } from "../../config/logger"

interface RegionData {
  id: number
  nom: string
  fit1: number
  fit2: number
  fit3: number
  fit4: number
}

interface DepartementData {
  id: number
  region_id: number
  nom: string
  fit1: number
  fit2: number
  fit3: number
  fit4: number
}

interface CommuneData {
  id: number
  departement_id: number
  nom: string
  fit1: number
  fit2: number
  fit3: number
  fit4: number
}

interface CamerounData {
  id: number
  forme: string
}

/**
 * Calculate center coordinates from bounding box (fit1, fit2, fit3, fit4)
 * fit1 = min longitude, fit2 = min latitude
 * fit3 = max longitude, fit4 = max latitude
 */
function calculateCenter(fit1: number, fit2: number, fit3: number, fit4: number) {
  const longitude = (fit1 + fit3) / 2
  const latitude = (fit2 + fit4) / 2
  return { longitude, latitude }
}

/**
 * Extract INSERT statements from SQL file
 */
function extractInsertStatements(sqlContent: string, tableName: string): string[] {
  const regex = new RegExp(
    `INSERT INTO \`${tableName}\`[^;]*;`,
    'gi'
  )
  const matches = sqlContent.match(regex)
  return matches || []
}

/**
 * Parse INSERT statement to extract values
 */
function parseInsertValues(insertStatement: string): any[] {
  // Extract the VALUES part
  const valuesMatch = insertStatement.match(/VALUES\s*(.+);?$/is)
  if (!valuesMatch) return []

  const valuesStr = valuesMatch[1]

  // Split by ),( to get individual rows
  const rows: any[] = []
  const rowMatches = valuesStr.match(/\(([^)]+)\)/g)

  if (!rowMatches) return []

  rowMatches.forEach(rowMatch => {
    // Remove parentheses
    const cleanRow = rowMatch.slice(1, -1)

    // Split by commas, handling quoted strings
    const values: any[] = []
    let current = ''
    let inQuote = false
    let quoteChar = ''

    for (let i = 0; i < cleanRow.length; i++) {
      const char = cleanRow[i]

      if ((char === "'" || char === '"') && cleanRow[i - 1] !== '\\') {
        if (!inQuote) {
          inQuote = true
          quoteChar = char
        } else if (char === quoteChar) {
          inQuote = false
          quoteChar = ''
        }
      }

      if (char === ',' && !inQuote) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    // Push last value
    if (current.trim()) {
      values.push(current.trim())
    }

    rows.push(values)
  })

  return rows
}

/**
 * Clean and convert value
 */
function cleanValue(value: string): any {
  if (!value || value === 'NULL') return null

  // Remove quotes
  if ((value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))) {
    return value.slice(1, -1)
  }

  // Try to parse as number
  const num = Number(value)
  if (!isNaN(num)) return num

  return value
}

/**
 * Import regions from SQL file
 */
async function importRegions(sqlContent: string): Promise<void> {
  logger.info("Importing regions...")

  const insertStatements = extractInsertStatements(sqlContent, "regions")

  for (const statement of insertStatements) {
    const rows = parseInsertValues(statement)

    for (const row of rows) {
      if (row.length < 9) continue

      // Column order: id, region, fit1, fit2, fit3, fit4, createdAt, updatedAt, geom
      const cleanedRow = row.map(cleanValue)
      const [id, nom, fit1, fit2, fit3, fit4] = cleanedRow
      const geom = row[8] // Get raw geom value before cleaning
      const { longitude, latitude } = calculateCenter(fit1, fit2, fit3, fit4)

      // Convert hexadecimal WKB string to Buffer for MySQL GEOMETRY type
      let geometryBuffer = null
      if (geom && typeof geom === 'string') {
        // Remove quotes if present
        let geomStr = geom.trim()
        if ((geomStr.startsWith("'") && geomStr.endsWith("'")) ||
            (geomStr.startsWith('"') && geomStr.endsWith('"'))) {
          geomStr = geomStr.slice(1, -1)
        }

        if (geomStr.startsWith('0x')) {
          geometryBuffer = Buffer.from(geomStr.substring(2), 'hex')
          if (id === 1) {
            logger.info(`First region - geom string length: ${geomStr.length}, buffer length: ${geometryBuffer.length}`)
          }
        }
      }

      await Region.upsert({
        id,
        nom,
        latitude,
        longitude,
        geometry: geometryBuffer,
      })
    }
  }

  logger.info("Regions imported successfully")
}

/**
 * Import departements from SQL file
 */
async function importDepartements(sqlContent: string): Promise<void> {
  logger.info("Importing departements...")

  const insertStatements = extractInsertStatements(sqlContent, "departements")

  for (const statement of insertStatements) {
    const rows = parseInsertValues(statement)

    for (const row of rows) {
      if (row.length < 10) continue

      // Column order: id, region_id, departement, fit1, fit2, fit3, fit4, createdAt, updatedAt, geom
      const cleanedRow = row.map(cleanValue)
      const [id, regionId, nom, fit1, fit2, fit3, fit4] = cleanedRow
      const geom = row[9] // Get raw geom value before cleaning
      const { longitude, latitude } = calculateCenter(fit1, fit2, fit3, fit4)

      // Convert hexadecimal WKB string to Buffer for MySQL GEOMETRY type
      let geometryBuffer = null
      if (geom && typeof geom === 'string') {
        // Remove quotes if present
        let geomStr = geom.trim()
        if ((geomStr.startsWith("'") && geomStr.endsWith("'")) ||
            (geomStr.startsWith('"') && geomStr.endsWith('"'))) {
          geomStr = geomStr.slice(1, -1)
        }

        if (geomStr.startsWith('0x')) {
          geometryBuffer = Buffer.from(geomStr.substring(2), 'hex')
        }
      }

      await Departement.upsert({
        id,
        nom,
        regionId,
        latitude,
        longitude,
        geometry: geometryBuffer,
      })
    }
  }

  logger.info("Departements imported successfully")
}

/**
 * Import communes (arrondissements) from SQL file
 */
async function importCommunes(sqlContent: string): Promise<void> {
  logger.info("Importing communes (arrondissements)...")

  const insertStatements = extractInsertStatements(sqlContent, "communes")

  for (const statement of insertStatements) {
    const rows = parseInsertValues(statement)

    for (const row of rows) {
      if (row.length < 12) continue

      // Column order: id, departement_id, commune, superficie, fit1, fit2, fit3, fit4, division, createdAt, updatedAt, geom
      const cleanedRow = row.map(cleanValue)
      const [id, departementId, nom, , fit1, fit2, fit3, fit4] = cleanedRow
      const geom = row[11] // Get raw geom value before cleaning
      const { longitude, latitude } = calculateCenter(fit1, fit2, fit3, fit4)

      // Convert hexadecimal WKB string to Buffer for MySQL GEOMETRY type
      let geometryBuffer = null
      if (geom && typeof geom === 'string') {
        // Remove quotes if present
        let geomStr = geom.trim()
        if ((geomStr.startsWith("'") && geomStr.endsWith("'")) ||
            (geomStr.startsWith('"') && geomStr.endsWith('"'))) {
          geomStr = geomStr.slice(1, -1)
        }

        if (geomStr.startsWith('0x')) {
          geometryBuffer = Buffer.from(geomStr.substring(2), 'hex')
        }
      }

      await Arrondissement.upsert({
        id,
        nom,
        departementId,
        latitude,
        longitude,
        geometry: geometryBuffer,
      })
    }
  }

  logger.info("Communes (arrondissements) imported successfully")
}

/**
 * Import cameroun data from SQL file
 */
async function importCameroun(sqlContent: string): Promise<void> {
  logger.info("Importing Cameroun data...")

  const insertStatements = extractInsertStatements(sqlContent, "cameroun")

  for (const statement of insertStatements) {
    const rows = parseInsertValues(statement)

    for (const row of rows) {
      if (row.length < 2) continue

      const [id, forme] = row.map(cleanValue)

      await Cameroun.upsert({
        id,
        forme,
      })
    }
  }

  logger.info("Cameroun data imported successfully")
}

/**
 * Main import function
 */
export async function importGeographicData(): Promise<void> {
  try {
    logger.info("Starting geographic data import...")

    // Read SQL file
    const sqlFilePath = path.join(process.cwd(), "u877916646_patnuc.sql")
    const sqlContent = await fs.readFile(sqlFilePath, "utf-8")

    // Import in order (respecting foreign keys)
    await importCameroun(sqlContent)
    await importRegions(sqlContent)
    await importDepartements(sqlContent)
    await importCommunes(sqlContent)

    logger.info("Geographic data import completed successfully!")
  } catch (error) {
    logger.error("Error importing geographic data:", error)
    throw error
  }
}

// Run if called directly
if (require.main === module) {
  importGeographicData()
    .then(() => {
      logger.info("Import finished")
      process.exit(0)
    })
    .catch((error) => {
      logger.error("Import failed:", error)
      process.exit(1)
    })
}
