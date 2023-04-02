/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Item, Recipe, ItemRate } from '../model/model';
import recipesJson from '../resources/recipes.json';

export const items: Map<string, Item> = new Map<string, Item>([]);
export const recipes: Recipe[] = [];
export const worldData = {
	maximums: new Map<Item, number>([]),
	calculateWP: (item: ItemRate): number => {
		return item.rate / worldData.maximums.get(item.item)! * 10_000;
	}
};

function readRecipes() {
	items.clear();
	recipes.length = 0;
	for (const key in recipesJson) {
		const recipe = recipesJson[key as keyof typeof recipesJson];
		const recipeItems = recipe.input.concat(recipe.output).map(input => input.name);
		for (const item of recipeItems)
			if (!items.has(item))
				items.set(item, new Item(item));

		recipes.push(new Recipe(
			recipe.name,
			recipe.machine[0],
			recipe.input.map(input => new ItemRate(items.get(input.name)!, input.rate)),
			recipe.output.filter(op => op.name !== 'water').map(output => new ItemRate(items.get(output.name)!, output.rate)),
			recipe.alt
		));
	}
	worldData.maximums = new Map<Item, number>([
		[items.get('water')!, Infinity],
		[items.get('liquidOil')!, 11_700],

		[items.get('nitrogenGas')!, 12_000],

		[items.get('oreIron')!, 70_380],
		[items.get('oreCopper')!, 28_860],
		[items.get('oreGold')!, 11_040],
		[items.get('stone')!, 52_860],
		[items.get('coal')!, 30_120],
		[items.get('sulfur')!, 6_840],
		[items.get('rawQuartz')!, 10_500],
		[items.get('oreBauxite')!, 9_780],
		[items.get('oreUranium')!, 2_100],
		[items.get('samOre')!, 5_400],
		[items.get('wood')!, 0],
		[items.get('mycelia')!, 0],
		[items.get('leaves')!, 0],
	]);
}

readRecipes();
