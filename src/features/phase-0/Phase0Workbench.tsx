import { useState } from "react";
import { RecordCard } from "../../components/RecordCard";
import { StatusBadge } from "../../components/StatusBadge";
import { Phase0JudgementCard } from "./Phase0JudgementCard";
import { Phase0MockSatellitePanel } from "./Phase0MockSatellitePanel";
import {
  summarizePhase0PreparationChecks,
  summarizePhase0ToolNeedSignals,
} from "./phase0-heuristics";
import type { Phase0MessyRecord, Phase0JudgementDraft } from "./phase0-types";

// 品質排序：高到低
const qualitySortOrder = [
  "M-010", // 高品質
  "M-009", // 中品質
  "M-003", // 中品質
  "M-011", // 中品質
  "M-012", // 低品質
  "M-007", // 低品質
  "M-008", // 低品質
  "M-006", // 低品質
  "M-005", // 低品質
  "M-004", // 低品質
  "M-002", // 低品質
  "M-001", // 最低品質
];

function getQualitySortIndex(recordId: string): number {
  const index = qualitySortOrder.indexOf(recordId);
  return index !== -1 ? index : 999; // 未找到的放在最後
}

export function Phase0Workbench({
  records,
  selectedRecordId,
  onSelect,
  drafts,
  onUpdateDraft,
}: {
  records: Phase0MessyRecord[];
  selectedRecordId: string;
  onSelect: (recordId: string) => void;
  drafts: Record<string, Phase0JudgementDraft>;
  onUpdateDraft: (recordId: string, draft: Phase0JudgementDraft) => void;
}) {
  const [isReportDraftOpen, setIsReportDraftOpen] = useState(false);
  const [reportDraftNote, setReportDraftNote] = useState("");
  const sortedRecords = [...records].sort(
    (a, b) => getQualitySortIndex(a.id) - getQualitySortIndex(b.id),
  );

  const selectedRecord =
    sortedRecords.find((record) => record.id === selectedRecordId) ??
    sortedRecords[0];
  const currentDraft = drafts[selectedRecord.id];
  const toolNeedSignals = summarizePhase0ToolNeedSignals(sortedRecords);
  const toolNames = Array.from(
    new Set(toolNeedSignals.map((signal) => signal.label)),
  );
  const preparationChecks = summarizePhase0PreparationChecks(sortedRecords);

  return (
    <div className="workbench">
      <div className="workbench__intro">
        <div className="workbench__intro-header">
          <div>
            <p className="eyebrow">整理工作台</p>
            <h2>
              第一階段的成功不是分類正確，而是把為什麼現在還不能判斷說清楚。
            </h2>
            <p>
              這裡先只標示安全邊界，真正的候選判斷要由小組和 coding agent
              補上；這不是 runtime LLM 分析，也不是正式資料模型。
            </p>
          </div>
          <button
            className="report-draft-button"
            type="button"
            aria-label={isReportDraftOpen ? "收合報案草稿" : "新增報案草稿"}
            aria-describedby="report-draft-button-note"
            onClick={() => setIsReportDraftOpen((current) => !current)}
          >
            <span>{isReportDraftOpen ? "收合報案草稿" : "新增報案草稿"}</span>
            <small id="report-draft-button-note">只建立待確認草稿</small>
          </button>
        </div>

        {isReportDraftOpen && (
          <section className="report-draft-panel" aria-label="報案草稿">
            <div>
              <h3>報案草稿</h3>
              <p>這張草稿只留在畫面上協助整理，不會送出，也不是已確認通報。</p>
            </div>
            <label>
              參考原始資訊
              <select
                value={selectedRecord.id}
                onChange={(event) => onSelect(event.target.value)}
              >
                {sortedRecords.map((record) => (
                  <option key={record.id} value={record.id}>
                    {record.id}：{record.location ?? "位置不明"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              需要人工確認的報案內容
              <textarea
                value={reportDraftNote}
                onChange={(event) => setReportDraftNote(event.target.value)}
                placeholder="只寫原文看得到的事，缺少的地點、時間、聯絡方式和安全狀況要明確標出。"
                rows={4}
              />
            </label>
          </section>
        )}
      </div>

      <div className="workbench__layout">
        <aside className="workbench__queue" aria-label="選擇原始資訊">
          {sortedRecords.map((record) => (
            <button
              className={record.id === selectedRecord.id ? "active" : ""}
              key={record.id}
              type="button"
              onClick={() => onSelect(record.id)}
            >
              <span>{record.id}</span>
              <StatusBadge status={record.verificationStatus} />
            </button>
          ))}
        </aside>

        <div className="workbench__main">
          <RecordCard record={selectedRecord} />

          <Phase0MockSatellitePanel selectedRecord={selectedRecord} />

          <Phase0JudgementCard
            judgement={currentDraft}
            record={selectedRecord}
            onUpdate={(updated) => onUpdateDraft(selectedRecord.id, updated)}
          />
        </div>

        <aside className="workbench__checklist">
          <section
            className="preparation-summary"
            aria-label="出發前待確認小卡"
          >
            <h3>出發前待確認小卡</h3>
            <p>這些問題不能由工作台替你決定；只能提醒下一位協作者要問清楚。</p>
            <ul>
              {preparationChecks.map((item) => (
                <li key={item.label}>
                  <strong>{item.label}</strong>
                  <span>
                    {item.status === "has_raw_clue"
                      ? `${item.relatedRecordIds.join("、")} 有原文線索`
                      : "原文沒有線索"}
                  </span>
                  <small>{item.reviewQuestion}</small>
                </li>
              ))}
            </ul>
          </section>

          <section className="tool-summary" aria-label="工具與物資待確認摘要">
            <h3>工具與物資待確認</h3>
            <p>這不是採購或派工清單，只是原始資訊中出現的準備線索。</p>
            {toolNames.length > 0 ? (
              <ul>
                {toolNames.map((toolName) => {
                  const related = toolNeedSignals.filter(
                    (signal) => signal.label === toolName,
                  );

                  return (
                    <li key={toolName}>
                      <strong>{toolName}</strong>
                      <span>
                        {related.map((signal) => signal.recordId).join("、")}
                        ：需要人工確認
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>目前沒有工具或物資線索。</p>
            )}
          </section>

          <h3>第一階段完成檢查</h3>
          <ul>
            <li>✓ Starter 已載入 {sortedRecords.length} 筆原始資訊</li>
            <li>✓ 可編輯、刪除或重設整理草稿</li>
            <li>✓ 至少 6 筆原始資訊被整理成具體草稿</li>
            <li>✓ 至少 2 個候選判斷由人類質疑或修正</li>
            <li>✓ 資料品質問題已寫進 observations</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
