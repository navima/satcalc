/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useEffect, useState } from 'react';
import './App.css';
import CalculatorService from './service';
import { Graph, ItemRate } from './model';

function App() {
	const [calculatorService, setCalculatorService] = useState(() => new CalculatorService());

	const [item, setItem] = React.useState(calculatorService.items.get('reinforcedIronPlate')!);
	const [amount, setAmount] = React.useState(60);
	const [itemInputValue, setItemInputValue] = React.useState(item.name);
	const [resultGraph, setResultGraph] = useState<Graph>();

	useEffect(() => {
		setResultGraph(calculatorService.calculate([], [new ItemRate(item, amount)]));
	}, [item, amount]);

	return (
		<div>
			<input list='items' value={itemInputValue} onChange={(e) => {
				setItemInputValue(e.target.value);
				if (calculatorService.items.has(e.target.value)) {
					setItem(calculatorService.items.get(e.target.value)!);
				}
			}} />
			<input type='number' value={amount} onChange={(e) => setAmount(+e.target.value)} />
			<datalist id='items'>
				{Array.from(calculatorService.items.entries(), entry => (
					<option key={entry[0]} value={entry[0]}>{entry[1].name}</option>
				))}
			</datalist>
		</div>
	);
}

export default App;
