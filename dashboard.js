
/* 
* Data Visualization - Framework
* Copyright (C) University of Passau
*   Faculty of Computer Science and Mathematics
*   Chair of Cognitive sensor systems
* Maintenance:
*   2025, Alexander Gall <alexander.gall@uni-passau.de>
*
* All rights reserved.
*/

// TODO: File for Part 2
// TODO: You can edit this file as you wish - add new methods, variables etc. or change/delete existing ones.

// TODO: use descriptive names for variables
let chart1, chart3, chart4, chart5, chart7,chart8;

let dashboardData = []
let brushedDataChart4 = [];
let brushedDataChart1 = [];
let selectedBoxCategory = null;



function initDashboard(_data) {
    // Prepare and store data
    dashboardData = _data.map((d, i) => ({ ...d, __id: i }));

    const categoricalColumns = Object.keys(_data[0]).filter(k => typeof _data[0][k] === "string");
    const numericColumns = Object.keys(_data[0]).filter(k => typeof _data[0][k] === "number");

    ["chart1-level1", "chart1-level2", "chart1-level3"].forEach(id => {
        populateDropdown(id, categoricalColumns);
        document.getElementById(id).value = categoricalColumns[0];
        document.getElementById(id).addEventListener("change", createChart1);
    });

    populateDropdown("chart1-size", numericColumns);
    document.getElementById("chart1-size").value = numericColumns[0];
    document.getElementById("chart1-size").addEventListener("change", createChart1);


    // Chart 3 (Scatterplot)
    populateDropdown("chart3-x", numericColumns);
    populateDropdown("chart3-y", numericColumns);
    document.getElementById("chart3-x").value = numericColumns[0];
    document.getElementById("chart3-y").value = numericColumns[1];

    document.getElementById("chart3-x").addEventListener("change", () => {
        createChart3();
        syncDensityWithScatter();
    });
    
    document.getElementById("chart3-y").addEventListener("change", () => {
        createChart3();
        syncDensityWithScatter();
    });

    // Chart 5 (Boxplot)
    populateDropdown("chart5-x", Object.keys(_data[0]));
    populateDropdown("chart5-y", numericColumns);

    document.getElementById("chart5-x").addEventListener("change", createChart5);
    document.getElementById("chart5-y").addEventListener("change", createChart5);

    // Chart 8 (Density Plot)
    populateDropdown("chart8-x", numericColumns);
    populateDropdown("chart8-y", numericColumns);

    document.getElementById("chart8-x").value = numericColumns[0];
    document.getElementById("chart8-y").value = numericColumns[1];

    document.getElementById("chart8-x").addEventListener("change", createChart8);
    document.getElementById("chart8-y").addEventListener("change", createChart8);




    chart1 = d3.select("#chart1")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");


    chart3 = d3.select("#chart3")
    .append("svg").attr("width", width)
    .attr("height", height)
    .append("g");

    chart4 = d3.select("#chart4")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g");


    chart5 = d3.select("#chart5")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g");

    chart7 = d3.select("#chart7")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g");

    chart8 = d3.select("#chart8")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g");
    
    
    createChart1();
    createChart3();
    createChart4();
    createChart5();
    createChart7();
    createChart8();

    document.getElementById("reset-chart1").addEventListener("click", () => {
    brushedDataChart1 = [];
    createChart1();
    createChart2(); // Show placeholder
    createChart5(); // Show placeholder
});

    const resetAllBtn = document.getElementById("reset-all");
    if (resetAllBtn) {
        resetAllBtn.addEventListener("click", () => {
            brushedDataChart1 = [];
            brushedDataChart4 = [];
            createChart1();
            createChart3();
            createChart4();
            createChart5();
            createChart7();
            createChart8();
        });
    }
}

function getFilteredData() {
    return brushedDataChart1.length > 0 ? brushedDataChart1 : dashboardData;
}

    
//SUNBURST MAP
function createChart1() {
    chart1.selectAll("*").remove();

    const level1 = document.getElementById("chart1-level1").value;
    const level2 = document.getElementById("chart1-level2").value;
    const level3 = document.getElementById("chart1-level3").value;
    const sizeAttr = document.getElementById("chart1-size").value;

    const sourceData = getFilteredData(); // Supports brushing/filtering from other charts

    const nested = d3.rollup(
        sourceData,
        v => d3.sum(v, d => +d[sizeAttr]),
        d => d[level1],
        d => d[level2],
        d => d[level3]
    );

    const root = d3.hierarchy([null, nested], ([, value]) =>
        value instanceof Map ? Array.from(value) : null
    ).sum(([_, value]) => typeof value === "number" ? value : 0);

    const radius = Math.min(width, height) / 2;

    const partition = d3.partition().size([2 * Math.PI, radius]);
    partition(root);

    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .innerRadius(d => d.y0)
        .outerRadius(d => d.y1);

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    chart1.attr("transform", `translate(${width / 2}, ${height / 2})`);

    const tooltip = d3.select("#tooltip");

    chart1.selectAll("path")
        .data(root.descendants().filter(d => d.depth))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.ancestors().map(d => d.data[0]).filter(Boolean).join("/")))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .on("mouseover", function (event, d) {
            d3.selectAll("path").style("opacity", 0.3);
            d3.select(this).style("opacity", 1);

            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`
                <strong>Path:</strong> ${d.ancestors().map(d => d.data[0]).reverse().slice(1).join(" → ")}<br>
                <strong>Value:</strong> ${d.value.toFixed(1)}
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mousemove", event => {
            tooltip.style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function () {
            tooltip.transition().duration(300).style("opacity", 0);
            d3.selectAll("path").style("opacity", 1);
        })
        .on("click", (event, d) => {
            filterBySunburstPath(d);
        });
}

function handleSunburstFilter(d) {
    const levels = ["chart1-level1", "chart1-level2", "chart1-level3"];
    const activeLevels = d.ancestors().slice(1); // skip root

    const filterFn = row => {
        return activeLevels.every((ancestor, i) => {
            const levelKey = document.getElementById(levels[i])?.value;
            return row[levelKey] === ancestor.data[0];
        });
    };

    brushedDataChart1 = dashboardData.filter(filterFn);

    createChart2(); // Histogram
    createChart5(); // Box Plot
}

//SCATTERPLOT WITH REGRESSION LINE
function createChart3() {
    chart3.selectAll("*").remove();

    const xAttr = document.getElementById("chart3-x").value;
    const yAttr = document.getElementById("chart3-y").value;

    const data = dashboardData
        .map(d => ({ ...d, x: +d[xAttr], y: +d[yAttr] }))  // already includes __id
        .filter(d => !isNaN(d.x) && !isNaN(d.y));


    const margin = { top: 30, right: 30, bottom: 50, left: 50 };

    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.x))
        .nice()
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.y))
        .nice()
        .range([height - margin.bottom, margin.top]);

    // Axes
    chart3.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(x));

    chart3.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(y));

    // Points
    chart3.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "scatter-point") 
        .attr("cx", d => x(d.x))
        .attr("cy", d => y(d.y))
        .attr("r", 4)
        .attr("fill", "#e91e63")
        .attr("opacity", 0.7);

    // Regression line
    const { slope, intercept } = linearRegression(data);

    const xRange = d3.extent(data, d => d.x);
    const regressionPoints = xRange.map(xVal => ({
        x: xVal,
        y: slope * xVal + intercept
    }));

    chart3.append("path")
        .datum(regressionPoints)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("d", d3.line()
            .x(d => x(d.x))
            .y(d => y(d.y))
        );

    // Labels
    chart3.append("text")
        .attr("x", (width + margin.left - margin.right) / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(xAttr);

    chart3.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", - (margin.top + (height - margin.top - margin.bottom) / 2))
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(yAttr);
    
    // Brushing
    const brush = d3.brush()
        .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
        .on("brush end", brushed);

    chart3.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(g => g.select(".selection")
            .attr("fill", "#80deea")        // Change to any desired color (e.g., light blue)
            .attr("fill-opacity", 0.4)      // Adjust transparency
            .attr("stroke", "#006064")      // Optional: border color
            .attr("stroke-width", 1));

        // Clear all brushes in Chart 4 when brushing in Chart 3
    chart4.selectAll("g[class^='brush-']")
        .each(function () {
            d3.select(this).call(d3.brushY().clear);
    });

    // Brushed callback
    function brushed({ selection }) {
        if (!selection) {
            chart3.selectAll(".scatter-point")
                .attr("fill", "#e91e63")
                .attr("opacity", 0.7);
            updateLinkedCharts([]);
            return;
        }

        const [[x0, y0], [x1, y1]] = selection;

        const selected = data.filter(d => {
            const cx = x(d.x);
            const cy = y(d.y);
            return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
        });

        // Highlight selected points in Chart 3
        chart3.selectAll(".scatter-point")
            .attr("fill", d => selected.includes(d) ? "#ff5722" : "#ccc")
            .attr("r", d => selected.includes(d) ? 6 : 3)
            .attr("opacity", d => selected.includes(d) ? 1 : 0.3);

        updateLinkedCharts(selected);
    }
}

//PARALLEL COORIDNATES
function createChart4() {
    chart4.selectAll("*").remove();

    const dimensions = Object.keys(dashboardData[0]).filter(key =>
        typeof dashboardData[0][key] === "number"
    );

    const margin = { top: 30, right: 10, bottom: 10, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const x = d3.scalePoint()
        .domain(dimensions)
        .range([margin.left, width - margin.right]);

    const y = {};
    dimensions.forEach(dim => {
        y[dim] = d3.scaleLinear()
            .domain(d3.extent(dashboardData, d => +d[dim]))
            .range([innerHeight, margin.top]);
    });

    const line = d3.line()
        .defined(([, v]) => v != null)
        .x(([dim, val]) => x(dim))
        .y(([dim, val]) => y[dim](val));

    const brushes = {}; // save brushes here for filtering

    // Draw lines with class and data-id
    chart4.selectAll(".data-line")
        .data(dashboardData, d => d.__id)
        .enter()
        .append("path")
        .attr("class", "data-line")
        .attr("d", d => line(dimensions.map(dim => [dim, d[dim]])))
        .attr("fill", "none")
        .attr("stroke", "#888")
        .attr("stroke-width", 1)
        .attr("opacity", 0.4);

    // Add axes and brushes
    dimensions.forEach(dim => {
        const axisGroup = chart4.append("g")
            .attr("transform", `translate(${x(dim)},0)`);

        axisGroup.call(d3.axisLeft(y[dim]));

        axisGroup.append("text")
            .style("text-anchor", "middle")
            .attr("y", margin.top - 10)
            .attr("transform", "rotate(-20)")
            .text(dim)
            .style("font-size", "11px");

        const brush = d3.brushY()
            .extent([[-10, margin.top], [+10, innerHeight]])
            .on("start brush end", brushed);

        axisGroup.append("g")
            .attr("class", `brush-${dim}`)
            .call(brush);

        brushes[dim] = null;
    });
    // Clear Chart 3 brush when interacting with Chart 4
    chart3.select(".brush").call(d3.brush().clear);

    // Fix deselection and ensure filtering propagates
    function brushed() {
    // Clear Chart 3 brush when Chart 4 is brushed
        chart3.select(".brush").call(d3.brush().clear);

        const activeBrushes = {};
        let isAnyBrushActive = false;

        dimensions.forEach(dim => {
            const brushSelection = d3.brushSelection(d3.select(`.brush-${dim}`).node());
            if (brushSelection) {
                const [y0, y1] = brushSelection;
                activeBrushes[dim] = [y[dim].invert(y1), y[dim].invert(y0)];
                isAnyBrushActive = true;
            } else {
                activeBrushes[dim] = null;
            }
        });

        const filtered = isAnyBrushActive
            ? dashboardData.filter(d =>
                dimensions.every(dim =>
                    !activeBrushes[dim] || (d[dim] >= activeBrushes[dim][0] && d[dim] <= activeBrushes[dim][1])
                )
            )
            : dashboardData;

        brushedDataChart4 = filtered;

        const selectedIds = new Set(filtered.map(d => d.__id));

        // Update Chart 4
        chart4.selectAll(".data-line")
            .attr("stroke", d => selectedIds.has(d.__id) ? "#d32f2f" : "#ccc")
            .attr("opacity", d => selectedIds.has(d.__id) ? 1 : 0.1);

        // Update Chart 3
        chart3.selectAll(".scatter-point")
            .attr("fill", d => selectedIds.has(d.__id) ? "#e91e63": "#ccc")
            .attr("r", d => selectedIds.has(d.__id) ? 6 : 3)
            .attr("opacity", d => selectedIds.has(d.__id) ? 1 : 0.3);
    }
}

//BOXPLOT
function createChart5() {
    chart5.selectAll("*").remove();

    const xAttr = document.getElementById("chart5-x").value;
    const yAttr = document.getElementById("chart5-y").value;

    const data = dashboardData;

    const grouped = d3.group(data, d => d[xAttr]);
    const categories = Array.from(grouped.keys()).sort();

    const margin = { top: 30, right: 30, bottom: 60, left: 50 };

    const x = d3.scaleBand()
        .domain(categories)
        .range([margin.left, width - margin.right])
        .padding(0.3);

    const y = d3.scaleLinear()
        .domain(d3.extent(data, d => +d[yAttr])).nice()
        .range([height - margin.bottom, margin.top]);

    // Axes
    chart5.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickSizeOuter(0))
        .selectAll("text")
        .attr("transform", "rotate(-30)")
        .style("text-anchor", "end");

    chart5.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    // Boxplots
    categories.forEach(cat => {
        const values = grouped.get(cat).map(d => +d[yAttr]).sort(d3.ascending);
        const q1 = d3.quantile(values, 0.25);
        const median = d3.quantile(values, 0.5);
        const q3 = d3.quantile(values, 0.75);
        const iqr = q3 - q1;
        const min = Math.max(d3.min(values), q1 - 1.5 * iqr);
        const max = Math.min(d3.max(values), q3 + 1.5 * iqr);

        const center = x(cat) + x.bandwidth() / 2;

        // Box
        chart5.append("rect")
        .attr("x", x(cat))
        .attr("y", y(q3))
        .attr("height", y(q1) - y(q3))
        .attr("width", x.bandwidth())
        .attr("fill", "#90caf9")
        .attr("class", "box-group")
        .style("cursor", "pointer")
        .on("click", () => {
            if (selectedBoxCategory === cat) {
            // Deselect
                selectedBoxCategory = null;
                resetHighlights();
            } else {
                selectedBoxCategory = cat;
                const selected = grouped.get(cat);
                highlightFromBoxplot(selected);
            }
        });


        // Median
        chart5.append("line")
            .attr("x1", x(cat))
            .attr("x2", x(cat) + x.bandwidth())
            .attr("y1", y(median))
            .attr("y2", y(median))
            .attr("stroke", "black");

        // Whiskers
        chart5.append("line")
            .attr("x1", center)
            .attr("x2", center)
            .attr("y1", y(min))
            .attr("y2", y(max))
            .attr("stroke", "black");

        chart5.append("line")
            .attr("x1", center - 10)
            .attr("x2", center + 10)
            .attr("y1", y(min))
            .attr("y2", y(min))
            .attr("stroke", "black");

        chart5.append("line")
            .attr("x1", center - 10)
            .attr("x2", center + 10)
            .attr("y1", y(max))
            .attr("y2", y(max))
            .attr("stroke", "black");
    });
}

//CORRELATION MATRIX
function createChart7() {
    chart7.selectAll("*").remove();

    const numericKeys = Object.keys(dashboardData[0])
        .filter(k => typeof dashboardData[0][k] === "number");

    // Compute correlation matrix
    const matrix = [];
    for (let i = 0; i < numericKeys.length; i++) {
        for (let j = 0; j < numericKeys.length; j++) {
            const x = numericKeys[i];
            const y = numericKeys[j];

            const corr = computeCorrelation(dashboardData, x, y);
            matrix.push({ x, y, value: corr });
        }
    }

    const margin = { top: 100, right: 10, bottom: 10, left: 100 };
    const gridSize = Math.min(
        (width - margin.left - margin.right) / numericKeys.length,
        (height - margin.top - margin.bottom) / numericKeys.length
    );

    const x = d3.scaleBand().domain(numericKeys).range([margin.left, margin.left + gridSize * numericKeys.length]);
    const y = d3.scaleBand().domain(numericKeys).range([margin.top, margin.top + gridSize * numericKeys.length]);

    const color = d3.scaleSequential(d3.interpolateRdBu)
        .domain([-1, 1]);

        chart7.selectAll("rect")
        .data(matrix)
        .enter()
        .append("rect")
        .attr("x", d => x(d.x))
        .attr("y", d => y(d.y))
        .attr("width", gridSize)
        .attr("height", gridSize)
        .attr("fill", d => color(d.value))
        .on("mouseover", function (event, d) {
            d3.select(this)
                .attr("stroke", "black")
                .attr("stroke-width", 1.5);
    
            d3.select("#tooltip")
                .style("opacity", 1)
                .html(`<strong>${d.x} vs ${d.y}</strong><br>Correlation: ${d.value.toFixed(2)}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mousemove", event => {
            d3.select("#tooltip")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function () {
            d3.select(this)
                .attr("stroke", null);
    
            d3.select("#tooltip")
                .style("opacity", 0);
        })
        .on("click", function (event, d) {
            document.getElementById("chart3-x").value = d.x;
            document.getElementById("chart3-y").value = d.y;
            createChart3();
            syncDensityWithScatter();
        })
        
    

    // Text labels
    chart7.selectAll(".label")
        .data(matrix)
        .enter()
        .append("text")
        .attr("x", d => x(d.x) + gridSize / 2)
        .attr("y", d => y(d.y) + gridSize / 2)
        .text(d => d.value.toFixed(2))
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .style("fill", d => Math.abs(d.value) > 0.5 ? "white" : "black")
        .style("font-size", "10px");

    // Axis labels
    chart7.selectAll(".xLabel")
        .data(numericKeys)
        .enter()
        .append("text")
        .attr("x", d => x(d) + gridSize / 2)
        .attr("y", margin.top - 10)
        .attr("text-anchor", "middle")
        .text(d => d)
        .style("font-size", "11px")
        .attr("transform", d => `rotate(-45, ${x(d) + gridSize / 2}, ${margin.top - 10})`);

    chart7.selectAll(".yLabel")
        .data(numericKeys)
        .enter()
        .append("text")
        .attr("x", margin.left - 10)
        .attr("y", d => y(d) + gridSize / 2)
        .attr("text-anchor", "end")
        .attr("alignment-baseline", "middle")
        .text(d => d)
        .style("font-size", "11px");
}

function computeCorrelation(data, attrX, attrY) {
    const x = data.map(d => +d[attrX]);
    const y = data.map(d => +d[attrY]);

    const meanX = d3.mean(x);
    const meanY = d3.mean(y);
    const stdX = d3.deviation(x);
    const stdY = d3.deviation(y);

    const cov = d3.mean(x.map((d, i) => (d - meanX) * (y[i] - meanY)));

    return cov / (stdX * stdY);
}

//DENSITY PLOT
function createChart8() {
    chart8.selectAll("*").remove();

    const xAttr = document.getElementById("chart8-x").value;
    const yAttr = document.getElementById("chart8-y").value;

    const data = dashboardData.map(d => ({
        x: +d[xAttr],
        y: +d[yAttr]
    })).filter(d => !isNaN(d.x) && !isNaN(d.y));

    const margin = { top: 30, right: 30, bottom: 50, left: 50 };

    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.x)).nice()
        .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
        .domain(d3.extent(data, d => d.y)).nice()
        .range([height - margin.bottom, margin.top]);

    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y);

    chart8.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(xAxis);

    chart8.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(yAxis);

    // Create 2D histogram density
    const densityData = d3.contourDensity()
        .x(d => x(d.x))
        .y(d => y(d.y))
        .size([width, height])
        .bandwidth(30)
        (data);

    // Color scale
    const color = d3.scaleSequential(d3.interpolateMagma)
        .domain([0, d3.max(densityData, d => d.value)]);

    chart8.selectAll("path")
        .data(densityData)
        .enter().append("path")
        .attr("d", d3.geoPath())
        .attr("fill", d => color(d.value))
        .attr("stroke", "#333")
        .attr("stroke-width", 0.2)
        .attr("opacity", 0.8);

    // Axis labels
    chart8.append("text")
        .attr("x", (width + margin.left - margin.right) / 2)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(xAttr);

    chart8.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", - (margin.top + (height - margin.top - margin.bottom) / 2))
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(yAttr);
}

function populateDropdown(id, options) {
    const select = document.getElementById(id);
    select.innerHTML = "";
    options.forEach(opt => {
        const option = document.createElement("option");
        option.value = opt;
        option.text = opt;
        select.appendChild(option);
    });
}

function linearRegression(data) {
    const n = data.length;
    const sumX = d3.sum(data, d => d.x);
    const sumY = d3.sum(data, d => d.y);
    const sumXY = d3.sum(data, d => d.x * d.y);
    const sumX2 = d3.sum(data, d => d.x * d.x);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
}

function clearDashboard() {

    chart1.selectAll("*").remove();
    chart3.selectAll("*").remove();
    chart4.selectAll("*").remove();
    chart5.selectAll("*").remove();
    chart7.selectAll("*").remove();
    chart8.selectAll("*").remove();

}

function updateLinkedCharts(selected) {
    const selectedIds = new Set(selected.map(d => d.__id));

    // Highlight only in Parallel Coordinates (Chart 4)
    chart4.selectAll(".data-line")
        .attr("stroke", d => selectedIds.has(d.__id) ? "#d32f2f" : "#ccc")
        .attr("opacity", d => selectedIds.has(d.__id) ? 1 : 0.1);
}

function highlightFromBoxplot(selected) {
    const selectedIds = new Set(selected.map(d => d.__id));

    // Highlight in Scatterplot (Chart 3)
    chart3.selectAll(".scatter-point")
        .attr("fill", d => selectedIds.has(d.__id) ? "#ff5722" : "#ccc")
        .attr("r", d => selectedIds.has(d.__id) ? 6 : 3)
        .attr("opacity", d => selectedIds.has(d.__id) ? 1 : 0.3);

    // Highlight in Parallel Coordinates (Chart 4)
    chart4.selectAll(".data-line")
        .attr("stroke", d => selectedIds.has(d.__id) ? "#d32f2f" : "#ccc")
        .attr("opacity", d => selectedIds.has(d.__id) ? 1 : 0.1);
}

function resetHighlights() {
    chart3.selectAll(".scatter-point")
        .attr("fill", "#e91e63")
        .attr("r", 4)
        .attr("opacity", 0.7);

    chart4.selectAll(".data-line")
        .attr("stroke", "#888")
        .attr("opacity", 0.4);
}

function syncDensityWithScatter() {
    const xAttr = document.getElementById("chart3-x").value;
    const yAttr = document.getElementById("chart3-y").value;

    document.getElementById("chart8-x").value = xAttr;
    document.getElementById("chart8-y").value = yAttr;

    createChart8();
}

