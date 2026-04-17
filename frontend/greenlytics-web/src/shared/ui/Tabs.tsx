interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  activeTab: string;
  items: TabItem[];
  onChange: (tabId: string) => void;
}

export function Tabs({ activeTab, items, onChange }: TabsProps) {
  return (
    <div className="tabs-strip" role="tablist" aria-label="Section tabs">
      {items.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            aria-selected={isActive}
            className={`tabs-strip__item${isActive ? ' tabs-strip__item--active' : ''}`}
            role="tab"
            type="button"
            onClick={() => onChange(item.id)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
