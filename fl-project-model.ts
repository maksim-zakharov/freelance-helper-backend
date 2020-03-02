export interface FlProjectModel {
    id: number;
    title: string;
    alreadyApplied: boolean;
    proposalCount?: number;
    link: string;
    description: string;
    price?: number;
}
