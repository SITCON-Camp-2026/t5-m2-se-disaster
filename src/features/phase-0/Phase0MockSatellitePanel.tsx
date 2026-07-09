import type { Phase0MessyRecord } from "./phase0-types";

function getMarkerPosition(recordId: string): { left: string; top: string } {
  const positions: Record<string, { left: string; top: string }> = {
    "M-001": { left: "34%", top: "42%" },
    "M-002": { left: "64%", top: "58%" },
    "M-003": { left: "46%", top: "34%" },
    "M-004": { left: "62%", top: "61%" },
    "M-005": { left: "28%", top: "24%" },
    "M-006": { left: "72%", top: "38%" },
    "M-007": { left: "50%", top: "70%" },
    "M-008": { left: "22%", top: "64%" },
    "M-009": { left: "39%", top: "47%" },
    "M-010": { left: "67%", top: "55%" },
    "M-011": { left: "58%", top: "76%" },
    "M-012": { left: "31%", top: "73%" },
  };

  return positions[recordId] ?? { left: "50%", top: "50%" };
}

export function Phase0MockSatellitePanel({
  selectedRecord,
}: {
  selectedRecord: Phase0MessyRecord;
}) {
  const markerPosition = getMarkerPosition(selectedRecord.id);

  return (
    <section className="mock-satellite-panel" aria-label="非真實衛星影像示意">
      <div className="mock-satellite-panel__header">
        <div>
          <p className="eyebrow">非真實影像</p>
          <h3>衛星影像示意</h3>
        </div>
        <span>{selectedRecord.id}</span>
      </div>

      <div
        className="mock-satellite"
        role="img"
        aria-label="非真實衛星影像示意圖"
      >
        <div className="mock-satellite__river" />
        <div className="mock-satellite__road mock-satellite__road--main" />
        <div className="mock-satellite__road mock-satellite__road--side" />
        <div className="mock-satellite__district mock-satellite__district--one" />
        <div className="mock-satellite__district mock-satellite__district--two" />
        <div className="mock-satellite__marker" style={markerPosition}>
          <span>{selectedRecord.id}</span>
        </div>
      </div>

      <p>
        這張圖只用來提醒「位置與路況仍需人工確認」。它不是地圖、不是真實衛星圖，
        也不能用來判斷可通行道路、集合點或車輛大小。
      </p>
    </section>
  );
}
