import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

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
  
  // Main execution
  async function main() {
    // Load and process data
    let data = await loadData();
    let commits = processCommits(data);
    
    console.log(commits);
    
    // Display some basic stats in the HTML
    const statsDiv = document.getElementById('stats');
    if (statsDiv) {
      statsDiv.innerHTML = `
        <h2>Repository Statistics</h2>
        <p>Total lines analyzed: ${data.length}</p>
        <p>Total commits: ${commits.length}</p>
        <p>Most active author: ${findMostActiveAuthor(commits)}</p>
      `;
    }
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
  
  // Execute the main function
  main();