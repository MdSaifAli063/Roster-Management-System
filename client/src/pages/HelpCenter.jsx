import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp, BookOpen, FileText, GraduationCap, Shield } from 'lucide-react';
import { SettingsPageHeader } from '../components/settings/SettingsShell';
import DashboardPanel from '../components/dashboard/DashboardPanel';
import { HELP_ARTICLES, HELP_FAQS, HELP_GUIDES } from '../data/helpCenterFaqs';
import { cn } from '../lib/utils';

const TABS = [
  { id: 'faq', label: 'FAQ', icon: BookOpen },
  { id: 'articles', label: 'Articles', icon: FileText },
  { id: 'guides', label: 'Guides & Tutorials', icon: GraduationCap },
  { id: 'terms', label: 'Terms & Conditions', icon: Shield },
  { id: 'privacy', label: 'Privacy Policy', icon: Shield },
];

function FaqAccordion({ items, query }) {
  const [openId, setOpenId] = useState(items[0]?.id || null);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [items, query]);

  if (!filtered.length) {
    return <p className="py-8 text-center text-sm text-slate-500">No results for your search.</p>;
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {filtered.map((item) => {
        const open = openId === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 py-4 text-left"
              onClick={() => setOpenId(open ? null : item.id)}
            >
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.q}</span>
              {open ? (
                <ChevronUp className="h-5 w-5 shrink-0 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
              )}
            </button>
            {open && <p className="pb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.a}</p>}
          </div>
        );
      })}
    </div>
  );
}

export default function HelpCenter() {
  const [tab, setTab] = useState('faq');
  const [query, setQuery] = useState('');
  const [bannerQuery, setBannerQuery] = useState('');

  const runSearch = () => {
    setQuery(bannerQuery);
    setTab('faq');
  };

  return (
    <div className="-mx-3 -mt-2 space-y-6 sm:-mx-5 md:-mx-6">
      <SettingsPageHeader
        title="Help Center"
        subtitle="Find solutions and support for common RosterPro questions."
      />

      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-600 to-cyan-600 px-6 py-10 text-center text-white shadow-lg sm:px-10">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">Find What You Need</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-blue-100">
          Search FAQs, guides, and articles for roster, attendance, leave, and billing help.
        </p>
        <div className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={bannerQuery}
              onChange={(e) => setBannerQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              placeholder="Quick search…"
              className="w-full rounded-xl border-0 py-3 pl-10 pr-4 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-white/40"
            />
          </div>
          <button
            type="button"
            onClick={runSearch}
            className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50"
          >
            Search
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1 dark:border-slate-700 dark:bg-slate-800/50">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-4',
                tab === t.id
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'faq' && (
        <DashboardPanel>
          <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Answers for employers and employees using RosterPro.
          </p>
          <div className="mt-6">
            <FaqAccordion items={HELP_FAQS} query={query} />
          </div>
        </DashboardPanel>
      )}

      {tab === 'articles' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HELP_ARTICLES.map((a) => (
            <DashboardPanel key={a.title} className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">{a.tag}</span>
              <h3 className="mt-2 font-display text-base font-semibold text-slate-900 dark:text-white">{a.title}</h3>
              <p className="mt-2 flex-1 text-sm text-slate-500">{a.summary}</p>
              <Link to="/help" className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700">
                Read more →
              </Link>
            </DashboardPanel>
          ))}
        </div>
      )}

      {tab === 'guides' && (
        <div className="space-y-3">
          {HELP_GUIDES.map((g) => (
            <DashboardPanel key={g.title} className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{g.title}</h3>
                <p className="text-sm text-slate-500">{g.steps} steps · interactive guide coming soon</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-500/15">
                Guide
              </span>
            </DashboardPanel>
          ))}
          <p className="text-sm text-slate-500">
            Need hands-on setup? Visit{' '}
            <Link to="/organization" className="font-medium text-blue-600">
              Organization
            </Link>{' '}
            or{' '}
            <Link to="/settings" className="font-medium text-blue-600">
              Settings
            </Link>
            .
          </p>
        </div>
      )}

      {(tab === 'terms' || tab === 'privacy') && (
        <DashboardPanel>
          <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            {tab === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
          </h3>
          <div className="prose prose-sm mt-4 max-w-none text-slate-600 dark:prose-invert dark:text-slate-400">
            <p>
              RosterPro is provided to your organization under your subscription plan. Use the platform in line with
              your company&apos;s workforce policies and applicable employment laws in your region.
            </p>
            <p>
              We store account, roster, attendance, and leave data needed to operate the service. Employers control
              employee records and can export reports from the Reports section. Contact your organization administrator
              for data access or deletion requests.
            </p>
            <p>
              Payment processing is handled by Stripe when billing is enabled. See{' '}
              <Link to="/settings/billing" className="text-blue-600">
                Billing settings
              </Link>{' '}
              for plan details.
            </p>
          </div>
        </DashboardPanel>
      )}
    </div>
  );
}
