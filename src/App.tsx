/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React from 'react';
import './App.css';
import CalculatorService from './service';
import { ItemRate } from './model';

function App() {
	const calculatorService = new CalculatorService();
	const resultGraph = calculatorService.calculate([], [new ItemRate(calculatorService.items.get('reinforcedIronPlate')!, 5)]);
	return (
		<div>
			Hi
		</div>
	);
}

export default App;
