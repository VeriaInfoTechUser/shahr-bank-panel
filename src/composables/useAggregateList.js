import { ref } from "vue";
import { useFetch } from "@/composables/useFetch.js";
import { uri } from "@/constants/config.js";
import { useCountryFlag } from "@/composables/useCountryFlag.js";
import { useOSFlag } from "@/composables/useOSIcon.js";

export function useAggregateList() {
    const aggregateList = ref({});
    const aggregateLoadingFlag = ref(true);

    async function getRegionsList() {
        aggregateLoadingFlag.value = true;
        try {
            const { data: regionsData, error } = await useFetch(uri.api.iaas.region.list, { method: "GET" });
            if (error) {
                console.error("Error fetching regions list", error);
                return;
            }

            for (let i = 0; i < regionsData.length; i++) {
                const region = regionsData[i];
                const isLastRegion = i === regionsData.length - 1;

                const { flag, getFlag } = useCountryFlag();
                getFlag(region.country);
                region.flag = flag.value;

                await getAggregateList(region, isLastRegion);
            }
        } catch (err) {
            console.error("Error in getRegionsList", err);
        } finally {
            aggregateLoadingFlag.value = false;
        }
    }

    async function getAggregateList(region, isLast) {
        try {
            const { data, error } = await useFetch(`${uri.api.iaas.aggregate.list}${region.id}`, { method: "GET" });
            if (error) {
                console.error("Error fetching aggregate data for region", error);
                return;
            }

            const osLogo = {};
            const osName = {};
            const osType = {};

            if (data.images.length > 0) {
                data.images.forEach((item, index) => {
                    const { osIcon, getOSLogo } = useOSFlag();
                    getOSLogo(item.name);

                    data.images[index].icon = osIcon.value;
                    osLogo[`${region.id}-${item.id}-logo`] = osIcon.value;
                    osName[`${region.id}-${item.id}-name`] = item.name;
                    osType[`${region.id}-${item.id}-type`] = item.os_type;
                });
            }

            aggregateList.value = {
                ...aggregateList.value,
                [`${region.id}`]: { ...data, ...region, ...osLogo, ...osName, ...osType },
            };
        } catch (err) {
            console.error("Error in getAggregateList", err);
        }
    }

    async function aggregateInitialize() {
        await getRegionsList();
    }

    return {
        aggregateList,
        aggregateLoadingFlag,
        aggregateInitialize,
    };
}
