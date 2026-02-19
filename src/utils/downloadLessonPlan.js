// src/utils/downloadLessonPlan.js
import { saveAs } from "file-saver"
import Docxtemplater from "docxtemplater"
import PizZip from "pizzip"

/**
 * Download lesson plan as a PDF
 * @param {string} lessonPlanText - Lesson content
 * @param {string} fileName - Default "lesson-plan.pdf"
 */
export function downloadLessonPlanAsPdf(lessonPlanText, fileName = "lesson-plan.pdf") {
  const blob = new Blob([lessonPlanText], { type: "application/pdf" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Download lesson plan as DOCX
 * Uses PizZip + Docxtemplater to generate a Word document
 * @param {string} lessonPlanText - Lesson content
 * @param {string} fileName - Default "lesson-plan.docx"
 */
export function downloadLessonPlanAsDocx(lessonPlanText, fileName = "lesson-plan.docx") {
  try {
    // Create a basic DOCX template
    const content = `
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p><w:r><w:t>${lessonPlanText}</w:t></w:r></w:p>
        </w:body>
      </w:document>
    `

    const zip = new PizZip()
    zip.file("word/document.xml", content)
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true })
    const blob = doc.getZip().generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })

    saveAs(blob, fileName)
  } catch (err) {
    console.error("Failed to generate DOCX:", err)
  }
}
