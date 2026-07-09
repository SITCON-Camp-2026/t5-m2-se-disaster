import { useState } from "react";
import { StatusBadge } from "../../components/StatusBadge";
import { findPhase0ToolNeedSignals } from "./phase0-heuristics";
import type { Phase0JudgementDraft, Phase0MessyRecord } from "./phase0-types";

const kindLabels: Record<Phase0JudgementDraft["possibleKind"], string> = {
  help_request_candidate: "求助候選",
  site_status_candidate: "地點狀態候選",
  task_candidate: "任務候選",
  assignment_candidate: "人員指派候選",
  announcement_candidate: "公告候選",
  unknown: "候選類型待判斷",
};

const confidenceLabels: Record<Phase0JudgementDraft["confidence"], string> = {
  low: "低",
  medium: "中",
  high: "高",
};

const nextStepLabels: Record<
  Phase0JudgementDraft["suggestedNextStep"],
  string
> = {
  keep_raw: "先保留原始資訊",
  ask_for_more_info: "補問來源或現場資訊",
  send_to_human_review: "交給人工確認",
  create_candidate_report: "建立候選通報",
  create_site_update_suggestion: "建立地點更新建議",
  do_not_use_yet: "暫時不要使用",
};

export function Phase0JudgementCard({
  judgement,
  record,
  onUpdate,
}: {
  judgement: Phase0JudgementDraft;
  record: Phase0MessyRecord;
  onUpdate?: (draft: Phase0JudgementDraft) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNote, setEditedNote] = useState(judgement.humanReviewNote || "");

  const handleSaveNote = () => {
    if (onUpdate) {
      onUpdate({
        ...judgement,
        humanReviewNote: editedNote,
      });
    }
    setIsEditing(false);
  };

  const hasContent = judgement.possibleKind !== "unknown";
  const toolNeedSignals = findPhase0ToolNeedSignals(record);

  return (
    <article className="judgement-card">
      <div className="judgement-card__header">
        <div>
          <p className="eyebrow">{hasContent ? "整理判斷" : "安全預設"}</p>
          <h3>
            {hasContent
              ? kindLabels[judgement.possibleKind]
              : "尚未建立整理草稿"}
          </h3>
          {record.location && (
            <p className="judgement-card__location">{record.location}</p>
          )}
          <p className="judgement-card__safety">不可直接派工，需人工確認</p>
        </div>
        <StatusBadge status={record.verificationStatus} />
      </div>

      {!hasContent && (
        <p>
          這張卡只保留保守的安全邊界，不是 agent 對這筆資料的整理答案。請讓
          coding agent 實作可建立、編輯與刪除的整理草稿。
        </p>
      )}

      <dl className="judgement-summary">
        <div>
          <dt>候選類型</dt>
          <dd>{kindLabels[judgement.possibleKind]}</dd>
        </div>
        <div>
          <dt>信心程度</dt>
          <dd>{confidenceLabels[judgement.confidence]}</dd>
        </div>
        <div>
          <dt>下一步</dt>
          <dd>{nextStepLabels[judgement.suggestedNextStep]}</dd>
        </div>
      </dl>

      <p>
        能否直接行動：
        <strong>
          {judgement.unsafeToActDirectly ? "不可直接行動" : "仍需確認情境"}
        </strong>
      </p>

      {hasContent && judgement.evidence.length > 0 && (
        <section>
          <h4>判斷依據</h4>
          <ul>
            {judgement.evidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {hasContent && judgement.blockers.length > 0 && (
        <section>
          <h4>目前卡住的地方</h4>
          <ul>
            {judgement.blockers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {toolNeedSignals.length > 0 && (
        <section className="tool-need-panel">
          <h4>工具與物資線索</h4>
          <p>以下只是從原文看到的線索，不能直接當成準備清單或派工依據。</p>
          <ul>
            {toolNeedSignals.map((signal) => (
              <li key={`${signal.recordId}-${signal.label}`}>
                <strong>{signal.label}</strong>
                <span>{signal.reviewQuestion}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!hasContent && judgement.evidence.length > 0 && (
        <section>
          <h4>目前只有安全預設</h4>
          <ul>
            {judgement.evidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {!hasContent && judgement.blockers.length > 0 && (
        <section>
          <h4>目前卡住的地方</h4>
          <ul>
            {judgement.blockers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h4>人類審查備註</h4>
        {isEditing ? (
          <div>
            <textarea
              value={editedNote}
              onChange={(e) => setEditedNote(e.target.value)}
              placeholder="記錄你對這個判斷的疑問或修正..."
              rows={4}
            />
            <div
              style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}
            >
              <button type="button" onClick={handleSaveNote}>
                保存
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditedNote(judgement.humanReviewNote || "");
                  setIsEditing(false);
                }}
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p>
              {editedNote || (
                <em style={{ color: "#999" }}>
                  {hasContent ? "可以記錄你的質疑或修正" : "安全預設，暫無備註"}
                </em>
              )}
            </p>
            {onUpdate && (
              <button type="button" onClick={() => setIsEditing(true)}>
                {editedNote ? "編輯備註" : "添加備註"}
              </button>
            )}
          </div>
        )}
      </section>
    </article>
  );
}
