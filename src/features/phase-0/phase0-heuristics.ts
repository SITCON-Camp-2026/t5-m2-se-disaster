import type {
  Phase0JudgementDraft,
  Phase0MessyRecord,
  Phase0PreparationCheckItem,
  Phase0ToolNeedSignal,
} from "./phase0-types";

const toolNeedRules: Array<{
  label: string;
  patterns: string[];
  reviewQuestion: string;
}> = [
  {
    label: "鏟子",
    patterns: ["鏟子"],
    reviewQuestion:
      "原文有提到鏟子，但可能是不缺或清單過期；先確認目前是否真的需要。",
  },
  {
    label: "清泥人手與清淤工具",
    patterns: ["清泥", "清淤"],
    reviewQuestion:
      "原文只看得出清泥或清淤線索；需要確認地點、數量、安全狀況與工具種類。",
  },
  {
    label: "雨鞋",
    patterns: ["雨鞋"],
    reviewQuestion:
      "雨鞋數量和尺寸可能已變動；需要現場盤點後才能當成可領取或需補充資訊。",
  },
  {
    label: "水電檢修工具或水電人員",
    patterns: ["水電"],
    reviewQuestion:
      "原文沒有足夠資訊判斷需要材料、工具或專業人員；需交由人工確認。",
  },
  {
    label: "搬運大型家具的人力或工具",
    patterns: ["大型家具", "搬動"],
    reviewQuestion:
      "涉及住家位置與當事人同意；不可只靠轉述直接派人或準備器材。",
  },
  {
    label: "藥品協助",
    patterns: ["藥品"],
    reviewQuestion:
      "涉及醫療判斷與當事人狀況；需人工或醫療角色確認，不能由工作台決定。",
  },
];

const preparationCheckRules: Array<{
  label: string;
  patterns: string[];
  reviewQuestionWhenFound: string;
  reviewQuestionWhenMissing: string;
}> = [
  {
    label: "食物",
    patterns: ["食物", "便當", "餐", "糧"],
    reviewQuestionWhenFound:
      "原文有食物線索，但仍要確認數量、地點、時間與是否還需要補充。",
    reviewQuestionWhenMissing:
      "原始資訊沒有食物供應或需求線索，不能推測現場有沒有吃的。",
  },
  {
    label: "飲用水",
    patterns: ["飲用水", "水"],
    reviewQuestionWhenFound:
      "原文有飲用水線索，但可能只代表某一時間點；要確認目前是否仍足夠、能不能領取或是否不要再送。",
    reviewQuestionWhenMissing:
      "原始資訊沒有飲用水線索，不能推測志工到場後一定有水。",
  },
  {
    label: "休息或睡覺地點",
    patterns: ["睡", "住宿", "休息", "過夜", "公園"],
    reviewQuestionWhenFound:
      "原文有休息或睡覺地點線索，但要確認是否開放、安全、是否需要報到，以及是否能過夜。",
    reviewQuestionWhenMissing:
      "原始資訊沒有可睡覺或可休息地點，不能把公園、活動中心或集合點推測成住宿處。",
  },
  {
    label: "道路與路況",
    patterns: ["道路", "封閉", "淹水", "入口", "不要再派人"],
    reviewQuestionWhenFound:
      "原文有道路、入口或淹水線索，但原因、範圍和時間可能不清楚；要由人工確認最新路況。",
    reviewQuestionWhenMissing: "原始資訊沒有路況線索，不能推測車輛可通行。",
  },
  {
    label: "車輛大小",
    patterns: ["小卡車", "大卡車", "貨車", "車輛", "載運"],
    reviewQuestionWhenFound:
      "原文有車輛線索，但要確認道路寬度、載重、迴轉空間與現場收送規則。",
    reviewQuestionWhenMissing:
      "原始資訊沒有小卡車或大卡車線索，不能直接決定車型或叫車。",
  },
];

export function findPhase0ToolNeedSignals(
  record: Phase0MessyRecord,
): Phase0ToolNeedSignal[] {
  return toolNeedRules
    .filter((rule) =>
      rule.patterns.some((pattern) => record.rawText.includes(pattern)),
    )
    .map((rule) => ({
      recordId: record.id,
      label: rule.label,
      rawClue: record.rawText,
      reviewQuestion: rule.reviewQuestion,
      canPrepareDirectly: false,
    }));
}

export function summarizePhase0ToolNeedSignals(
  records: Phase0MessyRecord[],
): Phase0ToolNeedSignal[] {
  return records.flatMap(findPhase0ToolNeedSignals);
}

export function summarizePhase0PreparationChecks(
  records: Phase0MessyRecord[],
): Phase0PreparationCheckItem[] {
  return preparationCheckRules.map((rule) => {
    const relatedRecordIds = records
      .filter((record) =>
        rule.patterns.some((pattern) => record.rawText.includes(pattern)),
      )
      .map((record) => record.id);

    return {
      label: rule.label,
      relatedRecordIds,
      status:
        relatedRecordIds.length > 0 ? "has_raw_clue" : "missing_from_raw_info",
      reviewQuestion:
        relatedRecordIds.length > 0
          ? rule.reviewQuestionWhenFound
          : rule.reviewQuestionWhenMissing,
    };
  });
}

// ponytail: this is a safety-boundary scaffold, not an answer engine.
export function createPhase0Judgement(
  record: Phase0MessyRecord,
): Phase0JudgementDraft {
  const isVerified = record.verificationStatus === "verified";

  // 針對特定資訊提供具體判斷，否則保守預設
  const specificJudgements: Record<string, Phase0JudgementDraft> = {
    "M-003": {
      messyRecordId: "M-003",
      possibleKind: "site_status_candidate",
      confidence: "medium",
      evidence: [
        "現場回報說『不缺鏟子，現在比較需要水電』",
        "提到『原本那張單可能沒更新』，承認資訊可能過時",
        "來源是 field_report，時間戳明確",
      ],
      blockers: [
        "與 M-001 的需求（十幾個人清泥）無法直接配對",
        "『比較需要』是相對比較，需確認水電的具體需求",
        "現場狀態隨時改變，建議與最新現場回報交叉確認",
      ],
      suggestedNextStep: "create_site_update_suggestion",
      unsafeToActDirectly: true,
      humanReviewNote: "品質中等，有具體內容但需與其他資訊交叉確認",
    },
    "M-007": {
      messyRecordId: "M-007",
      possibleKind: "assignment_candidate",
      confidence: "low",
      evidence: [
        "社群貼文說某工班可以支援水電",
        "回報者提供了替代資訊來源（留言意見）",
      ],
      blockers: [
        "操作者不是當事人：是社群使用者而非工班本人確認",
        "名單已過期：『那是昨天的名單，今天沒空』",
        "無法確認工班的實際可用性和具體服務範圍",
        "無聯絡方式或確認機制",
      ],
      suggestedNextStep: "ask_for_more_info",
      unsafeToActDirectly: true,
      humanReviewNote: "操作者非當事人，需直接與工班確認可用性",
    },
    "M-009": {
      messyRecordId: "M-009",
      possibleKind: "announcement_candidate",
      confidence: "medium",
      evidence: [
        "14:20 現場志工直接回報，具體時間戳",
        "內容明確：集合點開放、限制條件清楚",
        "提到物理證據：『入口公告貼在站前遮雨棚』",
        "志工並指出官方公告未同步：『尚未看到官方公告同步更新』",
      ],
      blockers: [
        "公告狀態與官方不同步，可能造成混亂",
        "限制條件（只接受報到志工）需要更廣泛傳達",
        "建議與官方同步後再當正式公告",
      ],
      suggestedNextStep: "create_candidate_report",
      unsafeToActDirectly: true,
      humanReviewNote: "品質較高，現場資訊明確，適合建立候選通報但需與官方協調",
    },
    "M-010": {
      messyRecordId: "M-010",
      possibleKind: "site_status_candidate",
      confidence: "high",
      evidence: [
        "值守志工直接確認，具體數據：『雨鞋約剩 12 雙，尺寸多為 26-28』",
        "物資狀態清晰：『飲用水暫時不缺；不再收二手衣物』",
        "轉運指示明確：『若要登記水電檢修需求，請改到大進路口服務台』",
        "有更新計畫：『下一次現場盤點預計 16:30』",
        "14:35 的時間戳，資訊相對新鮮",
      ],
      blockers: [
        "14:35 至今已過時，物資狀態可能改變",
        "需定期更新以保持準確性",
      ],
      suggestedNextStep: "create_site_update_suggestion",
      unsafeToActDirectly: true,
      humanReviewNote:
        "品質最高，具體數據與行動指示清楚，適合建立更新建議但需定期更新",
    },
    "M-011": {
      messyRecordId: "M-011",
      possibleKind: "help_request_candidate",
      confidence: "medium",
      evidence: [
        "明確需求：『需要協助搬動大型家具』",
        "狀況確認：『住家泥水已退』",
        "位置信息（但不完整）：『大進路口往溪邊方向第二排住家』",
      ],
      blockers: [
        "操作者不是當事人：是志工代長者轉述，非當事人直接表達",
        "隱私未確認：『尚未確認長者是否同意公開完整地址』",
        "位置信息不足：無完整地址，無法直接派人",
        "無聯絡方式確認",
      ],
      suggestedNextStep: "send_to_human_review",
      unsafeToActDirectly: true,
      humanReviewNote:
        "操作者非當事人，且涉及隱私和老年人保護，必須直接與當事人確認",
    },
    "M-012": {
      messyRecordId: "M-012",
      possibleKind: "help_request_candidate",
      confidence: "low",
      evidence: [
        "明確需求類別：『疑似需要藥品協助』",
        "回報者身分明確：『外地家屬來電』",
      ],
      blockers: [
        "操作者不是當事人：家屬在外地，無法確認親友的實際狀況",
        "位置不明確：『住在光復老街附近』，無具體地址",
        "無法確認親友的確切位置和當前狀態",
        "無法確認親友是否同意建立任務",
        "藥品協助涉及醫療判斷，不能由非醫療人員決定",
      ],
      suggestedNextStep: "send_to_human_review",
      unsafeToActDirectly: true,
      humanReviewNote:
        "操作者非當事人且距離遠，位置不明，涉及醫療判斷，需直接與親友或當地人確認",
    },
  };

  const specific = specificJudgements[record.id];
  if (specific) {
    return specific;
  }

  return {
    messyRecordId: record.id,
    possibleKind: "unknown",
    confidence: "low",
    evidence: ["尚未建立整理草稿：請由小組從原文標出判斷依據。"],
    blockers: isVerified
      ? ["仍需確認這筆資訊適合進入哪個後續流程。"]
      : ["目前不是已確認資訊，不能直接行動或當成事實發布。"],
    suggestedNextStep: isVerified ? "keep_raw" : "send_to_human_review",
    unsafeToActDirectly: true,
  };
}
