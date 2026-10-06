import {
  BellRingIcon,
  BookOpenIcon,
  CloudIcon,
  DatabaseIcon,
  LayoutGridIcon,
  MapPinIcon,
  RouteIcon,
  SettingsIcon,
  ShieldCheckIcon } from
'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
}

export const navGroups: {id: string;position: 'top' | 'bottom';items: NavItem[];}[] = [
{ id: 'home', position: 'top', items: [{ id: 'overview', label: 'Overview', path: '/', icon: LayoutGridIcon }] },
{
  id: 'main',
  position: 'top',
  items: [
  { id: 'fraud_rules', label: 'Fraud Rules', path: '/fraud-rules', icon: ShieldCheckIcon },
  { id: 'lakehouse', label: 'Data Lakehouse', path: '/lakehouse', icon: DatabaseIcon },
  { id: 'patterns', label: 'Fraud Patterns', path: '/patterns', icon: RouteIcon },
  { id: 'geo_risk', label: 'Geo Risk', path: '/geo-risk', icon: MapPinIcon },
  { id: 'alerts', label: 'Alerts', path: '/alerts', icon: BellRingIcon }]

},
{ id: 'docs', position: 'bottom', items: [{ id: 'docs', label: 'Integration Docs', path: '/docs', icon: BookOpenIcon }] },
{
  id: 'system',
  position: 'bottom',
  items: [
  { id: 'settings', label: 'Settings', path: '/settings', icon: SettingsIcon },
  { id: 'sync', label: 'Cloud Sync', path: '/sync', icon: CloudIcon }]

}];