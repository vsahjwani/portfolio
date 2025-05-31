import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Store scales globally to use in brushing
let xScale, yScale;
// Store commits globally for filtering
let commits;
// Store original data globally
let data;

// Time filtering variables
let commitProgress = 100;
let timeScale;
let commitMaxTime;
let filteredCommits = [];

/**
 * Loads CSV data and converts string values to appropriate types
 */
async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: Number(row.line),
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));
  
    return data;
  }
  
  /**
   * Process commit data from line-level data
   * Groups lines by commit and extracts/calculates relevant properties
   */
  function processCommits(data) {
    return d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        
        let ret = {
          id: commit,
          url: 'https://github.com/vis-society/lab-7/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };
  
        // Add lines as a non-enumerable property so it doesn't show up in console.log
        Object.defineProperty(ret, 'lines', {
          value: lines,
          configurable: true,
          writable: true,
          enumerable: false // This makes it hidden during console.log
        });
  
        return ret;
      });
  }
  
  /**
   * Update the file display with unit visualization
   */
  function updateFileDisplay(filteredCommits) {
    // Get lines and files from filtered commits
    let lines = filteredCommits.flatMap((d) => d.lines);
    let files = d3
      .groups(lines, (d) => d.file)
      .map(([name, lines]) => {
        return { name, lines };
      });

    let filesContainer = d3
      .select('#files')
      .selectAll('div')
      .data(files, (d) => d.name)
      .join(
        // This code only runs when the div is initially rendered
        (enter) =>
          enter.append('div').call((div) => {
            div.append('dt').call(dt => {
              dt.append('code');
              dt.append('small').style('display', 'block').style('opacity', '0.7').style('font-size', '0.8em');
            });
            div.append('dd');
          }),
      );

    // Update the file names and line counts
    filesContainer.select('dt > code').text((d) => d.name);
    filesContainer.select('dt > small').text((d) => `${d.lines.length} lines`);

    // Create unit visualization - append one div for each line
    filesContainer
      .select('dd')
      .selectAll('div')
      .data((d) => d.lines)
      .join('div')
      .attr('class', 'loc');
  }
  
  /**
   * Render commit information using D3 DOM manipulation
   */
  function renderCommitInfo(data, commits) {
    // Clear existing content first
    d3.select('#stats').html('<h2>Repository Statistics</h2>');
    
    // Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
  
    // Add total LOC (Lines of Code)
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);
  
    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);
  
    // Number of files in the codebase
    const numFiles = d3.group(data, d => d.file).size;
    dl.append('dt').text('Number of files');
    dl.append('dd').text(numFiles);
  
    // Maximum file length (in lines)
    const fileLengths = d3.rollups(
      data, 
      v => d3.max(v, d => d.line), 
      d => d.file
    );
    const maxFileLength = d3.max(fileLengths, d => d[1]);
    dl.append('dt').text('Maximum file length');
    dl.append('dd').text(maxFileLength + ' lines');
  
    // Longest file (name of the file with the most lines)
    const longestFile = d3.greatest(fileLengths, d => d[1])?.[0];
    dl.append('dt').text('Longest file');
    dl.append('dd').text(longestFile);
  
    // Average file length (in lines)
    const avgFileLength = d3.mean(fileLengths, d => d[1]);
    dl.append('dt').text('Average file length');
    dl.append('dd').text(Math.round(avgFileLength) + ' lines');
  
    // Average line length (in characters)
    const avgLineLength = d3.mean(data, d => d.length);
    dl.append('dt').text('Average line length');
    dl.append('dd').text(Math.round(avgLineLength) + ' characters');
  
    // Maximum depth
    const maxDepth = d3.max(data, d => d.depth);
    dl.append('dt').text('Maximum depth');
    dl.append('dd').text(maxDepth);
  
    // Time of day that most work is done
    const workByPeriod = d3.rollups(
      data,
      v => v.length,
      d => {
        const hour = d.datetime.getHours();
        if (hour >= 5 && hour < 12) return 'Morning';
        if (hour >= 12 && hour < 17) return 'Afternoon';
        if (hour >= 17 && hour < 21) return 'Evening';
        return 'Night';
      }
    );
    const maxPeriod = d3.greatest(workByPeriod, d => d[1])?.[0];
    const maxPeriodCount = d3.greatest(workByPeriod, d => d[1])?.[1];
    dl.append('dt').text('Most productive time');
    dl.append('dd').text(`${maxPeriod} (${maxPeriodCount} lines)`);
  
    // Day of the week that most work is done
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const workByDay = d3.rollups(
      data,
      v => v.length,
      d => daysOfWeek[d.datetime.getDay()]
    );
    const maxDay = d3.greatest(workByDay, d => d[1])?.[0];
    const maxDayCount = d3.greatest(workByDay, d => d[1])?.[1];
    dl.append('dt').text('Most productive day');
    dl.append('dd').text(`${maxDay} (${maxDayCount} lines)`);
  }
  
  /**
   * Update tooltip content with commit information
   */
  function renderTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('commit-time');
    const author = document.getElementById('commit-author');
    const lines = document.getElementById('commit-lines');

    if (Object.keys(commit).length === 0) return;

    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
      dateStyle: 'full',
    });
    time.textContent = commit.datetime?.toLocaleString('en', {
      timeStyle: 'medium',
    });
    author.textContent = commit.author;
    lines.textContent = `${commit.totalLines} lines`;
  }
  
  /**
   * Show or hide the tooltip
   */
  function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
  }
  
  /**
   * Update tooltip position based on mouse event
   */
  function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX + 15}px`;
    tooltip.style.top = `${event.clientY + 15}px`;
  }
  
  /**
   * Check if a commit is within the brush selection
   */
  function isCommitSelected(selection, commit) {
    if (!selection) {
      return false;
    }
    
    // Get pixel coordinates of this commit
    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);
    
    // Check if these coordinates are within the selection bounds
    return (
      selection[0][0] <= x && 
      x <= selection[1][0] && 
      selection[0][1] <= y && 
      y <= selection[1][1]
    );
  }
  
  /**
   * Handle brush events
   */
  function brushed(event) {
    const selection = event.selection;
    
    // Update circle styling based on selection - use filteredCommits for consistency
    d3.selectAll('circle').classed('selected', (d) => 
      isCommitSelected(selection, d)
    );
    
    // Update selection count
    renderSelectionCount(selection);
    
    // Update language breakdown
    renderLanguageBreakdown(selection);
  }
  
  /**
   * Create and configure the brush
   */
  function createBrushSelector(svg) {
    // Create brush and attach event listener
    svg.call(d3.brush().on('start brush end', brushed));
    
    // Raise dots and other elements above overlay
    svg.selectAll('.dots, .overlay ~ *').raise();
  }
  
  /**
   * Update the count of selected commits
   */
  function renderSelectionCount(selection) {
    const selectedCommits = selection
      ? filteredCommits.filter((d) => isCommitSelected(selection, d))
      : [];
      
    const countElement = document.querySelector('#selection-count');
    countElement.textContent = `${selectedCommits.length || 'No'} commits selected`;
    
    return selectedCommits;
  }
  
  /**
   * Display language breakdown for selected commits
   */
  function renderLanguageBreakdown(selection) {
    const selectedCommits = selection
      ? filteredCommits.filter((d) => isCommitSelected(selection, d))
      : [];
    const container = document.getElementById('language-breakdown');
    
    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }
    
    const requiredCommits = selectedCommits.length ? selectedCommits : filteredCommits;
    const lines = requiredCommits.flatMap((d) => d.lines);
    
    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
      lines,
      (v) => v.length,
      (d) => d.type,
    );
    
    // Update DOM with breakdown
    container.innerHTML = '';
    
    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);
      
      container.innerHTML += `
        <dt>${language}</dt>
        <dd>${count} lines (${formatted})</dd>
      `;
    }
  }
  
  /**
   * Render a scatterplot of commits by time of day
   */
  function renderScatterPlot(data, allCommits) {
    // Define dimensions
    const width = 1000;
    const height = 600;
    
    // Define margins
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    
    // Define usable area
    const usableArea = {
      top: margin.top,
      right: width - margin.right,
      bottom: height - margin.bottom,
      left: margin.left,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    };
    
    // Create SVG element
    const svg = d3
      .select('#chart')
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('overflow', 'visible');
    
    // Create scales and store them globally
    xScale = d3
      .scaleTime()
      .domain(d3.extent(commits, d => d.datetime)) // Use all commits for initial domain
      .range([usableArea.left, usableArea.right])
      .nice();
    
    yScale = d3
      .scaleLinear()
      .domain([0, 24])
      .range([usableArea.bottom, usableArea.top]);
    
    // Create color scale based on time of day
    const colorScale = d3
      .scaleLinear()
      .domain([0, 6, 12, 18, 24])
      .range(['#2c3e50', '#3498db', '#f39c12', '#e74c3c', '#2c3e50'])
      .interpolate(d3.interpolateRgb);
    
    // Calculate extent of edited lines
    const [minLines, maxLines] = d3.extent(allCommits, (d) => d.totalLines);
    
    // Create a square root scale for circle radius to ensure area is proportional to data
    const rScale = d3
      .scaleSqrt()
      .domain([minLines, maxLines])
      .range([2, 30]);
    
    // Add gridlines BEFORE the axes
    const gridlines = svg
      .append('g')
      .attr('class', 'gridlines')
      .attr('transform', `translate(${usableArea.left}, 0)`);
    
    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(
      d3.axisLeft(yScale)
        .tickFormat('')
        .tickSize(-usableArea.width)
    );
    
    // Create axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
      .axisLeft(yScale)
      .tickFormat(d => String(d % 24).padStart(2, '0') + ':00');
    
    // Add X axis with class for updating
    svg
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${usableArea.bottom})`)
      .call(xAxis);
    
    // Add Y axis with class for consistency
    svg
      .append('g')
      .attr('class', 'y-axis')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(yAxis);
    
    // Sort commits by total lines in descending order (larger dots are rendered first)
    const sortedCommits = d3.sort(allCommits, (d) => -d.totalLines);
    
    // Add dots
    const dots = svg.append('g').attr('class', 'dots');
    
    dots
      .selectAll('circle')
      .data(sortedCommits, (d) => d.id) // Add key function for stable transitions
      .join('circle')
      .attr('cx', d => xScale(d.datetime))
      .attr('cy', d => yScale(d.hourFrac))
      .attr('r', d => rScale(d.totalLines))
      .style('--r', d => rScale(d.totalLines)) // Set CSS variable for radius-based transitions
      .attr('fill', d => colorScale(d.hourFrac))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('fill-opacity', 0.7)
      .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
      })
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
        updateTooltipVisibility(false);
      });
      
    // Initialize the brush after creating the visualization
    createBrushSelector(svg);
  }

  /**
   * Update scatter plot with filtered commits
   */
  function updateScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const usableArea = {
      top: margin.top,
      right: width - margin.right,
      bottom: height - margin.bottom,
      left: margin.left,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    };

    const svg = d3.select('#chart').select('svg');

    // Update x-scale domain
    xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));

    // Create color scale based on time of day
    const colorScale = d3
      .scaleLinear()
      .domain([0, 6, 12, 18, 24])
      .range(['#2c3e50', '#3498db', '#f39c12', '#e74c3c', '#2c3e50'])
      .interpolate(d3.interpolateRgb);

    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

    const xAxis = d3.axisBottom(xScale);

    // Update x-axis
    const xAxisGroup = svg.select('g.x-axis');
    xAxisGroup.selectAll('*').remove();
    xAxisGroup.call(xAxis);

    const dots = svg.select('g.dots');

    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    dots
      .selectAll('circle')
      .data(sortedCommits, (d) => d.id) // Add key function for stable transitions
      .join('circle')
      .attr('cx', (d) => xScale(d.datetime))
      .attr('cy', (d) => yScale(d.hourFrac))
      .attr('r', (d) => rScale(d.totalLines))
      .style('--r', d => rScale(d.totalLines)) // Set CSS variable for radius-based transitions
      .attr('fill', d => colorScale(d.hourFrac))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('fill-opacity', 0.7)
      .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget).style('fill-opacity', 1);
        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
      })
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
        updateTooltipVisibility(false);
      });
  }
  
  /**
   * Add a legend explaining circle size
   */
  function addSizeLegend(commits) {
    const legendContainer = d3.select('#chart-container')
      .append('div')
      .attr('class', 'size-legend')
      .style('margin-top', '20px')
      .style('text-align', 'center');
      
    legendContainer.append('p')
      .text('Circle size represents number of lines edited in each commit')
      .style('font-style', 'italic')
      .style('margin-bottom', '5px');
      
    const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
    
    const legendText = legendContainer.append('div')
      .style('display', 'flex')
      .style('justify-content', 'space-between')
      .style('max-width', '300px')
      .style('margin', '0 auto');
      
    legendText.append('span')
      .text(`${minLines} lines`);
      
    legendText.append('span')
      .text(`${maxLines} lines`);
  }

  /**
   * Handle time slider changes
   */
  function onTimeSliderChange() {
    const slider = document.getElementById('commit-progress');
    const timeElement = document.getElementById('commit-time');
    
    // Update variables
    commitProgress = +slider.value;
    commitMaxTime = timeScale.invert(commitProgress);
    
    // Update time display
    timeElement.textContent = commitMaxTime.toLocaleString('en', {
      dateStyle: 'long',
      timeStyle: 'short'
    });
    
    // Filter commits
    filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
    
    // Update visualizations
    updateScatterPlot(data, filteredCommits);
    
    // Update file display
    updateFileDisplay(filteredCommits);
    
    // Update stats with filtered data
    const filteredData = data.filter(d => {
      const commitForLine = commits.find(c => c.id === d.commit);
      return commitForLine && commitForLine.datetime <= commitMaxTime;
    });
    renderCommitInfo(filteredData, filteredCommits);
  }
  
  // Main execution
  async function main() {
    // Load and process data
    data = await loadData();
    commits = processCommits(data);
    
    // Initialize filtered commits
    filteredCommits = commits;
    
    // Set up time scale
    timeScale = d3
      .scaleTime()
      .domain([
        d3.min(commits, (d) => d.datetime),
        d3.max(commits, (d) => d.datetime),
      ])
      .range([0, 100]);
    
    commitMaxTime = timeScale.invert(commitProgress);
    
    console.log(commits);
    
    // Clear the stats div first
    d3.select('#stats').html('<h2>Repository Statistics</h2>');
    
    // Render commit info with detailed stats
    renderCommitInfo(data, commits);
    
    // Initialize file display with all commits
    updateFileDisplay(filteredCommits);
    
    // Render the scatterplot
    renderScatterPlot(data, commits);
    
    // Add a legend for circle size
    addSizeLegend(commits);
    
    // Set up event listener for slider
    const slider = document.getElementById('commit-progress');
    slider.addEventListener('input', onTimeSliderChange);
    
    // Initialize time display
    onTimeSliderChange();
  }

  // Execute the main function
  main();