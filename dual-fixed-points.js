import * as echarts from "echarts/core";
import { ScatterChart } from "echarts/charts";
import { ToolboxComponent, LegendComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
echarts.use([ScatterChart, CanvasRenderer, ToolboxComponent, LegendComponent]);

import { complex, add, pow, multiply, norm } from "mathjs"; // use for complex operations
import {
  EigenvalueDecomposition,
  //WrapperMatrix2D,
  Matrix as Mx,
} from "ml-matrix";

import "./styles/style.scss";

//*************************************************************************************************************//

let maxIter = 9;

let substitutions = [
  // Rauzy with 9 letters as Bressaud's paper
  [2, 4],
  [3, 4],
  [3, 5],
  [0, 6],
  [0, 7],
  [0, 8],
  [1, 8],
  [1],
  [2],
];
let eigVectorIndex = 2;

let positiveFixed = [
  [0, 6, 0, 8, 2, 4, 1],
  [2, 4, 1, 8, 2, 4, 2],
  [3, 5, 0, 7, 3, 4, 2],
  [2, 4, 1, 8, 2, 4, 2],
  [3, 5, 0, 7, 3, 5],
  [0, 6, 0, 8],
];

let N = 6; //   3 positive and 3 negative periodic sequences

// why calculations becomes instable for maxIter > 10 ?

let numberOfLetters = substitutions.length;
let n = numberOfLetters;

const counts = (array, letter) =>
  array.reduce((p, c) => {
    return c === letter ? p + 1 : p;
  }, 0);
//array.filter((x) => x === letter).length; // count number of letters j in array sigma(i)

let M = Mx.zeros(n, n);
for (let i = 0; i < n; i++) {
  for (let j = 0; j < n; j++) {
    let count = counts(s(i), j);
    M.set(i, j, count || 0);
  }
}

function s(i) {
  // substitution
  if (Number.isInteger(i)) {
    return substitutions[i];
  } else if (Array.isArray(i)) {
    return i.map(s).flat();
  } else {
    console.log("susbtitution should be integer or array");
    return;
  }
}

let eigvInfo = new EigenvalueDecomposition(M);
// console.log("eigvInfo=", eigvInfo);

let beta1 = eigvInfo.imaginaryEigenvalues[eigVectorIndex]; // real and imaginary part of expanding eigenvalue
let beta2 = eigvInfo.realEigenvalues[eigVectorIndex];

let beta = complex(beta1, beta2);
let normaliz = pow(beta, -maxIter); // normalized the sums....

console.log("normaliz = ", normaliz.toString());

console.table(eigvInfo.diagonalMatrix.data); //eigvInfo.diagonalMatrix.data

// for some reason we will use this positions for the eigenvector....

let gamma_real = eigvInfo.eigenvectorMatrix.transpose().to2DArray()[
  eigVectorIndex
];
let gamma_imag = eigvInfo.eigenvectorMatrix.transpose().to2DArray()[
  eigVectorIndex - 1
];

let gamma = [];

for (let i = 0; i < numberOfLetters; i++) {
  gamma[i] = complex(gamma_real[i], gamma_imag[i]);
}

function iterate(letter) {
  let i = letter;
  let count = 0;
  while (count < maxIter) {
    i = s(i);
    count++;
  }
  console.log("W length =", i.length);
  return i; // i=[] is an array here
}

// create sigma^n(i) for all i

let words = [...Array(N).keys()].map((i) => iterate(positiveFixed[i])); //.reverse()); // n= numberOfLetters

for (let i = 3; i < N; i++) {
  words[i] = words[i].reverse(); // reverse the sequences associated to negative sequences
}

let fractals = [...Array(N)].map((x) => []);

fractals = words.map((x, idx) => {
  // sums all elements over x=words[i] for all i
  let signal = idx % N > 2 ? -1 : 1; // if index > 2 multiply by -1 the vector gamma

  let sums = [];
  x.reduce((p, c) => {
    p = add(p, multiply(normaliz, multiply(signal, gamma[c]))); // if index > 2 multiply by -1 the vector gamma
    sums.push([p.re, p.im]);
    return p; // return p is necessary!
  }, complex(0, 0));
  return sums;
});

const myChart = echarts.init(document.getElementById("jxgbox"), null, {
  width: 800,
  height: 600,
});

let series = []; // define the series of the 3 fractals for options

// series[0] = { type: "scatter", symbol: "circle", symbolSize: 6, data: fractal };

// let dataset= {
//   // Provide a set of data.
//   source: [
//     ['product', fractals[1]],
//     ['Matcha Latte', fractals[1]],
//     ['Milk Tea', fractals[1]],
//     ['Cheese Cocoa', fractals[1]],
//     ['Walnut Brownie', fractals[1]]
//   ]
// }

// series = fractals.map((f) => {
//   return {type: "scatter", symbolSize: 6}
// });

series = fractals.map((f) => {
  return { data: f, type: "scatter", symbol: "circle", symbolSize: 6 };
});

let legend = {
  data: ["Pos 1", "Pos 2", "Pos 3", "Neg 1", "Neg 2", "Neg 3"],
  backgroundColor: "#ccc",
  textStyle: {
    color: "black",
    // ...
  },
};

series = fractals.map((f, idx) => {
  return {
    data: f,
    name: legend.data[idx],
    type: "scatter",
    symbol: "circle",
    symbolSize: 6,
  };
});

let option = {
  toolbox: {
    feature: {
      saveAsImage: { type: "png", name: "fractal1" },
    },
  },
  legend, // legend defined above

  xAxis: {
    scale: true,
  },
  yAxis: {
    scale: true,
  },
  series, // series was defined above
};

option && myChart.setOption(option);
