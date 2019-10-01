import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import Select from 'react-select';
import './App.scss';

// eslint-disable-next-line
var {log} = console; 

const ResultList = ({searchResults}) => {
  if (searchResults.record_count > 0) {
          return (
          <React.Fragment>
          {searchResults.records.page.map( record => <ResultCard 
          key={record.external_id} 
          record={record}
          contentID={record.nodeid} 
          contentType={record.document_type}
          contentUrl={record.url}
          />)}
          </React.Fragment>
          );
  }
  if (searchResults.record_count === 0) {
      return 'No results found.';
  } else {
      return '';
  }
}

class ResultCard extends React.Component {

  constructor(props) {
      super(props);
      this.generateCategoryPath = this.generateCategoryPath.bind(this);
      this.getCategories = this.getCategories.bind(this);
  }
  
  generateCategoryPath(category_array, url) {
      if (category_array.length !== 0) {
          return (category_array.join(' > '));
      }
      else if (url.length > 0) {
          var urlObj = new URL(url);
          return (urlObj.pathname.replace(/\//gi, ' / '));
      }
      else {
          return null;
      }
  }
  getCategories = (record) => {
      // const {record} = this.props;
      // Lets get all the `category_x` prop values into an array.
      return (
      Object.keys(record)
      // Only return keys that start with category_
      .filter(key => /^category_/.test(key))
      // Order them alphanumerically so starts at category_0
      .sort()
      // From the filtered property names, return the actual value
      .map(key => record[key])
      );
  }
  
  render() {
      const {record} = this.props;
      return (       
          <a href={record.url} key={record.external_id}  className="search-result-item">
          {record.type === 'docs' && <div className="resource-type-label color-blue">Docs</div>}
          {record.type === 'forum' && <div className="resource-type-label color-green">Explorers Hub</div>}
          {record.type === 'nru' && <div className="resource-type-label color-yellow">NRU</div>}
          {record.type === 'blog' && <div className="resource-type-label color-red">Blog</div>}
          {record.type === 'storefront' && <div className="resource-type-label color-red">newrelic.com</div>}
          {record.type === 'developer' && <div className="resource-type-label color-purple">Developer</div>}
          <h2>{record.title}</h2>
          <p>
              {record.highlight.body && <small dangerouslySetInnerHTML={{__html: '...'+record.highlight.body+'...'}}></small>}
          </p>
          <p className="category-path">
              {this.generateCategoryPath( this.getCategories(record), record.url )}
          </p>
      </a>
      );
  }
}
ResultCard.propTypes = {
  record: PropTypes.object,
  handleClick: PropTypes.func,
  contentID: PropTypes.number,
  contentType: PropTypes.string,
  contentUrl: PropTypes.string,
}

const FormFilter = ({checked, onChange, title, className, label, children, disabled}) => {

  return (
      <div className="pretty p-icon p-round p-pulse">
          <input type="checkbox" name={label} checked={checked} disabled={disabled} onChange={onChange} title={title} />
          <label htmlFor={label}>{children}</label>
      </div>
  )
}
FormFilter.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  title: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.string,
  label: PropTypes.string,
  disabled: PropTypes.bool,
}

const Paginator = ({currentPage, perPage, numPages, resultCount, recordCount, onPageChange}) => {
  var startResultNumber, endResultNumber;
  if (currentPage !== numPages) {
      startResultNumber = (perPage * currentPage - perPage) + 1;
      endResultNumber = currentPage * recordCount;
  } 
  else if (currentPage === numPages) {
      startResultNumber = ((numPages - 1) * perPage) + 1;
      endResultNumber = startResultNumber + (recordCount - 1) ;
  }
  return (
      <div className="result-summary">
          <p><small>Showing <em>{startResultNumber} - {endResultNumber} </em> out of <em> {resultCount}</em> results</small></p>
          <a className="page-prev" onClick={() => onPageChange(--currentPage)}>&lt; Previous page</a>
          <a className="page-next" onClick={() => onPageChange(++currentPage)}>Next page &gt;</a>
      </div>
  )
}
Paginator.propTypes = {
  currentPage: PropTypes.number,
  perPage: PropTypes.number,
  numPages: PropTypes.number,
  recordCount: PropTypes.number,
  onPageChange: PropTypes.func,
  resultCount: PropTypes.number
}


class SelectFilterDocsContentTypes extends React.Component {
  constructor(props) {
      super(props);
      this.state = {
          selectedOption: null,
      };
  }
  handleChangeDocsContentType = selectedOption => {
    this.setState({ selectedOption });
    this.props.updateDocsContentTypeFilters({selectedOption});
  };
  render() {
    const { selectedOption } = this.state;

    return (
      <>
      <label>Docs content type</label>
      <Select
        value={selectedOption}
        onChange={this.handleChangeDocsContentType}
        isMulti
        placeholder="Any"
        isSearchable = {true}
        options={[
          
          { value: 'api_doc', label: 'API Method Doc' },
          { value: 'page', label: 'Basic Doc' },
          { value: 'attribute_definition', label: 'Event Attribute Definition Doc' },
          { value: 'views_page_content', label: 'Filterable Page'},
          { value: 'release_notes', label: 'Release Notes - Agent'},
          { value: 'release_notes_platform', label: 'Release Notes - Platform' },
          { value: 'troubleshooting_doc', label: 'Troubleshooting Doc' },
      ]}
      />
      </>
    );
  }
}
SelectFilterDocsContentTypes.propTypes = {
  updateDocsContentTypeFilters: PropTypes.func
}

class SelectFilterDocsCategories extends React.Component {
  constructor(props) {
      super(props);
      this.state = {
          selectedOption: null,
          categories: [],
          isLoading: false,
          error: null,
      };
  }
  componentWillMount() {
      this.setState({ isLoading: true });
      fetch('https://docs.newrelic.com/search-index/taxonomies.json', {
      method: 'GET', 
      headers: { 
          'X-Phpshield-Key-Disable' : 'SP6ZwOVbe76L_ZcPjaW70g'
      },
      redirect: 'follow'
      }).then(response => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error('Something went wrong ...');
          }
        })
        .then(data => this.setState({ categories: data, isLoading: false }))
        .catch(error => this.setState({ error, isLoading: false }));

  }
  handleChangeDocsCategories = selectedOption => {
    this.setState({ selectedOption });
    this.props.updateDocsCategoryFilters({selectedOption});
  };
  render() {
      const { selectedOption, categories } = this.state;
      
      const docsCategoriesOptions = [];
      if (categories.primaryNavTerms) {
      categories.primaryNavTerms.map((value) => {
            let termObj = {value: value.term.displayName, label: value.term.displayName};
            docsCategoriesOptions.push(termObj);
        })
      }
      
    return (
      <>
      <label>Main Topic Area</label>
      <Select
        value={selectedOption}
        onChange={this.handleChangeDocsCategories}
        isMulti
        placeholder="Any"
        isSearchable = {true}
        options = { docsCategoriesOptions }
      />
      </>
    );
  }
}
SelectFilterDocsCategories.propTypes = {
  updateDocsCategoryFilters: PropTypes.func
}

export default class SearchHelpResources extends React.Component {
  constructor(props) {
      super(props);
      this.state = {
          queryString: '',
          resourceTypeDocs: true,
          resourceTypeForum: false,
          resourceTypeBlog: false,
          resourceTypeNru: false,
          resourceTypeStorefront: false,
          resourceTypeDeveloperSite: false,
          resourceTypeDocsContentTypes: [],
          resourceTypeDocsCategories: [],
          searchResults: {},
          error: null,
          currentPage: 1,
      };
      this.handleChange = this.handleChange.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
      this.handleDocsResource = this.handleDocsResource.bind(this);
      this.handleForumResource = this.handleForumResource.bind(this);
      this.handleBlogResource = this.handleBlogResource.bind(this);
      this.handleNruResource = this.handleNruResource.bind(this);
      this.handleStorefrontResource = this.handleStorefrontResource.bind(this);
      this.handleDeveloperSiteResource = this.handleDeveloperSiteResource.bind(this);
      this.handleResourceTypeDocsContentTypes = this.handleResourceTypeDocsContentTypes.bind(this);
      this.handleResourceTypeDocsCategories = this.handleResourceTypeDocsCategories.bind(this);
      this.keyPress = this.keyPress.bind(this);
      this.handleSpellingSuggestion = this.handleSpellingSuggestion.bind(this);
  }
  handleChange(event) {
      this.setState({queryString: event.target.value});
  }
  handleDocsResource(event) {
      (!event.target.checked) ? this.setState({ resourceTypeDocsContentTypes: [] }) : this.setState({ resourceTypeDocsContentTypes: [] });
      this.setState({resourceTypeDocs: event.target.checked});
  }
  handleForumResource(event) {
      this.setState({resourceTypeForum: event.target.checked});
  }
  handleBlogResource(event) {
      this.setState({resourceTypeBlog: event.target.checked});
  }
  handleStorefrontResource(event) {
      this.setState({resourceTypeStorefront: event.target.checked});
  }
  handleNruResource(event) {
      this.setState({resourceTypeNru: event.target.checked});
  }
  handleDeveloperSiteResource(event) {
      this.setState({resourceTypeDeveloperSite: event.target.checked});
  }
  handleResourceTypeDocsContentTypes(docsContentTypeArray) {
      var values = [];
      docsContentTypeArray.selectedOption.forEach(element => {
          values.push(element);
      });
      this.setState({resourceTypeDocsContentTypes: values});
  }
  handleResourceTypeDocsCategories(docsCategoryArray) {
      var values = [];
      docsCategoryArray.selectedOption.forEach(element => {
          values.push(element);
      });
      this.setState({resourceTypeDocsCategories: values});
  }
  keyPress(e) {
      if (e.keyCode === 13) { // Enter
          this.handleSubmit(e);
      }
  }

  handleSpellingSuggestion () {
    var { text } = this.state.searchResults.info.page.spelling_suggestion;
    this.setState({queryString: text}, () => this.handleSubmit());
  }

  async handleSubmit(event) {
      // Optional document_type filter for docs
      // "document_type":["page", "attribute_definition", "troubleshooting_doc", "api_doc", "release_notes_platform", "release_notes", "views_page_content"]
      this.setState({ error: null, loading: true });
      if (event !== undefined) {event.preventDefault();}
      // event.preventDefault();
      const resourceTypeFilters = [];
      const docsContentTypeFiltersArr = this.state.resourceTypeDocsContentTypes.map(docType=>docType.value);
      const docsCategoriesFiltersArr = this.state.resourceTypeDocsCategories.map(docType=>docType.value);
      docsContentTypeFiltersArr.push ('!views_page_menu');
      if (this.state.resourceTypeDocs === true) {resourceTypeFilters.push('docs')}
      if (this.state.resourceTypeForum === true) {resourceTypeFilters.push('forum')}
      if (this.state.resourceTypeBlog === true) {resourceTypeFilters.push('blog')}
      if (this.state.resourceTypeNru === true) {resourceTypeFilters.push('nru')}
      if (this.state.resourceTypeStorefront === true) {resourceTypeFilters.push('storefront')}
      if (this.state.resourceTypeDeveloperSite === true) {resourceTypeFilters.push('developer')}
      const jsonBody = {
          "engine_key": "Ad9HfGjDw4GRkcmJjUut",
          "q": this.state.queryString,
          "spelling" : "strict",
          "per_page": "10",
          "page":this.state.currentPage,
          "filters": {
            "page": {
                  "type": resourceTypeFilters,
                  "document_type": docsContentTypeFiltersArr,
                  "category_0" : docsCategoriesFiltersArr,
              }
          }
      };
      if (this.state.queryString.length > 2) {
          try {
              this.setState({ loading: true });
              const response = await fetch('https://api.swiftype.com/api/v1/public/engines/search.json', {
              method: 'POST', 
              mode: 'cors', 
              cache: 'no-cache',
              credentials: 'same-origin', 
              headers: { 'Content-Type': 'application/json' },
              redirect: 'follow',
              referrer: 'no-referrer',
              body: JSON.stringify(jsonBody),
              });
              const searchResults = await response.json();
              this.setState({ searchResults });
          } catch (e) {
              this.setState({ error: e.message })
          } finally {
              this.setState({ loading: false });
          }
      }
      else {
          this.setState({ error: "Query string must be at least 3 characters.", loading: false })
      }
      
  }

  render() {
      const {
          queryString,
          searchResults,
          error,
      } = this.state;
      return (
          <React.Fragment>
          <div key="search" className="search-content">
              <div key className="search-input-wrapper">
                  <form onSubmit={ e => this.handleSubmit(e)}>
                      <input type="search" value={queryString} onChange={this.handleChange} onKeyDown={this.keyPress} name="query-string" placeholder="Search..." autoComplete="off" />
                      <div className="resource-filter-group">

                          <FormFilter 
                              checked={this.state.resourceTypeDocs} 
                              onChange={this.handleDocsResource} 
                              title="Search content on docs.newrelic.com"
                              className="p-primary"
                              label="resource-docs">Docs
                          </FormFilter>

                          {this.state.resourceTypeDocs && 
                          <div className="sub-filter">
                              <SelectFilterDocsContentTypes 
                                  updateDocsContentTypeFilters={this.handleResourceTypeDocsContentTypes} />
                          </div>
                          }
                          {this.state.resourceTypeDocs && 
                              <div className="sub-filter">
                              <SelectFilterDocsCategories 
                                  updateDocsCategoryFilters={this.handleResourceTypeDocsCategories} />
                              </div>
                          }

                          <FormFilter 
                              checked={this.state.resourceTypeForum} 
                              onChange={this.handleForumResource} 
                              title="Search content on discuss.newrelic.com"
                              className="p-success"
                              label="resource-forum">Explorers Hub
                          </FormFilter>

                          <FormFilter 
                              checked={this.state.resourceTypeBlog} 
                              onChange={this.handleBlogResource} 
                              title="Search content on blog.newrelic.com"
                              className="p-danger"
                              label="resource-blog">Blog
                          </FormFilter>

                          <FormFilter 
                              checked={this.state.handleNruResource} 
                              onChange={this.handleNruResource} 
                              title="Search content on learn.newrelic.com"
                              className="p-warning"
                              label="resource-nru">New Relic University
                          </FormFilter>

                          <FormFilter 
                              checked={this.state.resourceTypeStorefront} 
                              onChange={this.handleStorefrontResource} 
                              title="Search content on newrelic.com"
                              className="p-danger"
                              label="resource-storefront">Storefront
                          </FormFilter>

                          <FormFilter 
                              checked={this.state.resourceTypeDeveloperSite} 
                              onChange={this.handleDeveloperSiteResource} 
                              title="Search content on developer.newrelic.com"
                              className="p-danger"
                              label="resource-developer">Developer Site
                          </FormFilter>

                      </div>
                  </form>
              </div>
              {error && (<p className="error-message">Error: {error}</p>)}
              {searchResults.record_count === 0 && searchResults.info.page.spelling_suggestion &&
              <div>Try searching for 
                <button className="search-suggestion link" onClick={this.handleSpellingSuggestion}>{searchResults.info.page.spelling_suggestion.text}</button>
              </div>
              }
              {searchResults.record_count &&
                  <Paginator 
                  resultCount = {searchResults.info.page.total_result_count} 
                  perPage = {searchResults.info.page.per_page}
                  numPages = {searchResults.info.page.num_pages}
                  recordCount = {searchResults.record_count}
                  currentPage = {searchResults.info.page.current_page}
                  onPageChange = {currentPage => {
                      this.setState({currentPage}, () => this.handleSubmit())
                  }} />
              }
              <div className="flex-container wrap search-result-items">
                  <ResultList searchResults = {searchResults} />
              </div>
          </div>
          </React.Fragment>
      )
  }

}

