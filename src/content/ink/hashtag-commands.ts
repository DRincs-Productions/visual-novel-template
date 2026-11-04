import { assetAliasIds, bundleIds, characterIdsEnum } from "@/pixi-vn.keys.gen";
import { addBaseHashtagCommands, HashtagCommands } from "@drincs/pixi-vn-ink";
import { RegisteredCharacters } from "@drincs/pixi-vn/characters";
import { achievements } from "@drincs/roves-api/achievements";
import zod from "zod";

addBaseHashtagCommands({ bundleIds, assetAliasIds });

HashtagCommands.add(
    async (script, { navigate }) => {
        await navigate({ to: script[1] });
        return true;
    },
    {
        name: "navigate",
        description: `Navigates to a specified route within the game.

\`\`\`ink
# navigate <route>
\`\`\``,
        validation: zod.tuple([zod.literal("navigate"), zod.string()]),
    },
);

HashtagCommands.add(
    async (script) => {
        const character = RegisteredCharacters.get(script[1]);
        if (character) {
            character.name = script[2];
        }
        return true;
    },
    {
        name: "character rename",
        description: `Renames a character in the game.

\`\`\`ink
# rename <characterId> <newName>
\`\`\``,
        validation: zod.tuple([zod.literal("rename"), zod.enum(characterIdsEnum), zod.string()]),
    },
);

HashtagCommands.add(
    async (script) => {
        await achievements.unlock(script[2]);
        return true;
    },
    {
        name: "achievement",
        description: `Unlocks an achievement on the active platform (e.g. Steam) via Roves.

\`\`\`ink
# unlock achievement <achievementId>
\`\`\``,
        validation: zod.tuple([zod.literal("unlock"), zod.literal("achievement"), zod.string()]),
    },
);
