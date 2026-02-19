export const getBilingualFields = (lessonPlan) => {
  const plan = lessonPlan?.lessonPlan || lessonPlan

  const normalizeOutcomeObjects = (outcomes) => {
    if (!Array.isArray(outcomes)) return []
    return outcomes
      .map((o, index) => {
        if (o == null) return null
        if (typeof o === "string") {
          return {
            id: String.fromCharCode(97 + index),
            outcome: o,
          }
        }
        if (typeof o === "object") {
          const text = o.outcome ?? o.text ?? o.description ?? o.statement
          return {
            ...o,
            id: o.id ?? String.fromCharCode(97 + index),
            outcome: text ?? "",
          }
        }
        return {
          id: String.fromCharCode(97 + index),
          outcome: String(o),
        }
      })
      .filter(Boolean)
  }

  const normalizeSpecificLearningOutcomes = (value, fallbackStatement) => {
    if (!value) {
      return {
        statement: fallbackStatement,
        outcomes: [],
      }
    }
    if (Array.isArray(value)) {
      return {
        statement: fallbackStatement,
        outcomes: normalizeOutcomeObjects(value),
      }
    }
    if (typeof value === "object") {
      return {
        ...value,
        statement: value.statement ?? fallbackStatement,
        outcomes: normalizeOutcomeObjects(value.outcomes),
      }
    }
    return {
      statement: fallbackStatement,
      outcomes: normalizeOutcomeObjects([value]),
    }
  }

  const findKeyInsensitive = (obj, wantedKey) => {
    if (!obj || typeof obj !== "object") return undefined
    const wanted = String(wantedKey ?? "")
      .toLowerCase()
      .replace(/\s+/g, "")
    if (!wanted) return undefined

    const key = Object.keys(obj).find(
      (k) => String(k ?? "").toLowerCase().replace(/\s+/g, "") === wanted
    )
    return key ? obj[key] : undefined
  }

  const getKey = (obj, key) => {
    if (!obj || typeof obj !== "object") return undefined
    return obj?.[key] ?? findKeyInsensitive(obj, key)
  }

  const subjectCandidate =
    plan?.learningArea ||
    plan?.subject

  const isKiswahili =
    String(subjectCandidate ?? "").toLowerCase().includes("kiswahili") ||
    String(plan?.lessonTitle ?? "").toLowerCase().includes("kiswahili") ||
    getKey(plan, "mstari") != null

  if (isKiswahili) {
    // Kiswahili structure
    return {
      isKiswahili: true,
      labels: {
        school: "Shule",
        learningArea: "Eneo la Kujifunza",
        grade: "Darasa",
        date: "Tarehe",
        time: "Muda",
        roll: "Orodha ya Wanafunzi",
        boys: "Wavulana",
        girls: "Wasichana",
        total: "Jumla",
        strand: "MSTARI",
        subStrand: "MSTARI MDOGO",
        lessonTitle: "KICHWA CHA SOMO",
        specificLearningOutcomes: "MATOKEO MAHUSUSI YA KUJIFUNZA",
        outcomeStatement: "Mwishoni mwa somo hili, mwanafunzi aweze:",
        keyInquiryQuestions: "MASWALI MUHIMU YA UCHUNGUZI",
        coreCompetencies: "UWEZO WA MSINGI UTAKAOBORESHWA",
        linkToValues: "UHUSIANO NA MAADILI",
        linksToPCI: "UHUSIANO NA MASUALA YA SASA NA YA MUHIMU (PCI)",
        learningResources: "VIFAA VYA KUJIFUNZA",
        suggestedLearningExperiences: "UZOEFU WA KUJIFUNZA UNAOZINGATIWA",
        introduction: "Utangulizi/Kuanza",
        exploration: "Uchunguzi/Maendeleo ya Somo",
        reflection: "Tafakari",
        extension: "Upanuzi",
        parentalInvolvement: "USHIRIKI WA WAZAZI/HUDUMA YA JAMII",
        selfEvaluation: "TATHMINI YA KIBINAFSI",
        step: "Hatua",
      },
      data: {
        school: getKey(plan, "shule") || plan?.school || "",
        learningArea: getKey(plan, "eneo la kujifunza") || getKey(plan, "learningArea") || plan?.learningArea || "Kiswahili",
        grade: getKey(plan, "darasa") || plan?.grade || "",
        date: getKey(plan, "tarehe") || plan?.date || "",
        time: getKey(plan, "muda") || plan?.time || "",
        roll: {
          boys: getKey(plan?.roll, "wavulana") || plan?.roll?.boys || 0,
          girls: getKey(plan?.roll, "wasichana") || plan?.roll?.girls || 0,
          total: getKey(plan?.roll, "jumla") || plan?.roll?.total || 0,
        },
        strand: getKey(plan, "mstari") || plan?.strand || "",
        subStrand: getKey(plan, "mstari mdogo") || getKey(plan, "mstariMdogo") || plan?.subStrand || "",
        lessonTitle: getKey(plan, "kichwa cha somo") || getKey(plan, "lessonTitle") || plan?.lessonTitle || "",
        specificLearningOutcomes: normalizeSpecificLearningOutcomes(
          getKey(plan, "matokeo mahususi ya kujifunza") || plan?.specificLearningOutcomes,
          "Mwishoni mwa somo hili, mwanafunzi aweze:"
        ),
        keyInquiryQuestions: getKey(plan, "maswali muhimu ya uchunguzi") || plan?.keyInquiryQuestions || [],
        coreCompetencies: getKey(plan, "uwezo wa msingi utakaoboreshwa") || plan?.coreCompetenciesToBeDeveloped || [],
        linkToValues: getKey(plan, "uhusiano na maadili") || plan?.linkToValues || [],
        linksToPCI: getKey(plan, "uhusiano na masuala ya sasa") || plan?.linksToPCI || [],
        learningResources: getKey(plan, "vifaa vya kujifunza") || plan?.learningResources || [],
        suggestedLearningExperiences: getKey(plan, "uzoefu wa kujifunza") || plan?.suggestedLearningExperiences || {
          introduction: "",
          exploration: [],
          reflection: "",
          extension: ""
        },
        parentalInvolvement: getKey(plan, "ushiriki wa wazazi") || plan?.suggestedParentalInvolvement || "",
        selfEvaluation: getKey(plan, "tathmini ya kibinafsi") || plan?.selfEvaluationMarks || "",
      },
    }
  }

  // English structure
  return {
    isKiswahili: false,
    labels: {
      school: "School",
      learningArea: "Learning Area",
      grade: "Grade",
      date: "Date",
      time: "Time",
      roll: "Roll",
      boys: "Boys",
      girls: "Girls",
      total: "Total",
      strand: "STRAND",
      subStrand: "SUB-STRAND",
      lessonTitle: "LESSON TITLE",
      specificLearningOutcomes: "SPECIFIC LEARNING OUTCOMES",
      outcomeStatement: "By the end of this lesson, the learner should be able to:",
      keyInquiryQuestions: "KEY INQUIRY QUESTIONS",
      coreCompetencies: "CORE COMPETENCIES TO BE DEVELOPED",
      linkToValues: "LINK TO VALUES",
      linksToPCI: "LINKS TO PERTINENT AND CONTEMPORARY ISSUES (PCI)",
      learningResources: "LEARNING RESOURCES",
      suggestedLearningExperiences: "SUGGESTED LEARNING EXPERIENCES",
      introduction: "Introduction/Getting Started",
      exploration: "Exploration/Lesson Development",
      reflection: "Reflection",
      extension: "Extension",
      parentalInvolvement: "SUGGESTED PARENTAL INVOLVEMENT/COMMUNITY SERVICE LEARNING",
      selfEvaluation: "SELF-EVALUATION MARKS",
      step: "Step",
    },
    data: {
      school: plan?.school || "",
      learningArea: plan?.learningArea || plan?.subject || "",
      grade: plan?.grade || "",
      date: plan?.date || "",
      time: plan?.time || "",
      roll: plan?.roll || { boys: 0, girls: 0, total: 0 },
      strand: plan?.strand || "",
      subStrand: plan?.subStrand || "",
      lessonTitle: plan?.lessonTitle || "",
      specificLearningOutcomes: normalizeSpecificLearningOutcomes(
        plan?.specificLearningOutcomes,
        "By the end of this lesson, the learner should be able to:"
      ),
      keyInquiryQuestions: plan?.keyInquiryQuestions || [],
      coreCompetencies: plan?.coreCompetenciesToBeDeveloped || [],
      linkToValues: plan?.linkToValues || [],
      linksToPCI: plan?.linksToPCI || [],
      learningResources: plan?.learningResources || [],
      suggestedLearningExperiences: plan?.suggestedLearningExperiences || {
        introduction: "",
        exploration: [],
        reflection: "",
        extension: ""
      },
      parentalInvolvement: plan?.suggestedParentalInvolvement || "",
      selfEvaluation: plan?.selfEvaluationMarks || "",
    },
  }
}
