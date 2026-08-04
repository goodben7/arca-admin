import type { AppModule, ModuleMenuItem } from '@/lib/modules/registry';

export type ModuleMenuSection = { label: string; items: ModuleMenuItem[] };

export function splitModuleMenu(module: AppModule) {
    const overviewItems: ModuleMenuItem[] = [];
    const sectionMap = new Map<string, ModuleMenuItem[]>();

    for (const item of module.menu) {
        if (!item.section) {
            overviewItems.push(item);
            continue;
        }
        const list = sectionMap.get(item.section) ?? [];
        list.push(item);
        sectionMap.set(item.section, list);
    }

    const sections: ModuleMenuSection[] = [];
    for (const [label, items] of sectionMap) {
        sections.push({ label, items });
    }

    return { overviewItems, sections };
}
