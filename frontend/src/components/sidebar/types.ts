// Types for sidebar components

export interface NavigationItem {
  to: string;
  label: string;
  icon: string;
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}
