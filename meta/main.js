import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

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
   * Render commit information using D3 DOM manipulation
   */
  function renderCommitInfo(data, commits) {
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
   * Find the author with the most commits
   */
  function findMostActiveAuthor(commits) {
    const authorCounts = d3.rollup(
      commits,
      v => v.length,
      d => d.author
    );
    
    // Find the author with the maximum number of commits
    let maxAuthor = '';
    let maxCount = 0;
    
    for (let [author, count] of authorCounts) {
      if (count > maxCount) {
        maxCount = count;
        maxAuthor = author;
      }
    }
    
    return `${maxAuthor} (${maxCount} commits)`;
  }
  
  // Main execution
  async function main() {
    // Load and process data
    let data = await loadData();
    let commits = processCommits(data);
    
    console.log(commits);
    
    // Clear the stats div first
    d3.select('#stats').html('<h2>Repository Statistics</h2>');
    
    // Render commit info with detailed stats
    renderCommitInfo(data, commits);
  }
  
  // Execute the main function
  main();