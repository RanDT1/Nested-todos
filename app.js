  /*
  Project Todo List:
  1. things I need to get done with this list in the future.
  2. add comments to confusing parts of the code.
  3. fix autofocus on new elements.
  4. refactor the render function soo it JUST renders and not stores.
  5. create a function just for storage after rendering.
  6. organize code so it all fallows the same format.
  7. nest code in an IIFE.
  */

  'use strict';

  Handlebars.registerHelper('eq', function (a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});
  //Registering a handlebars partial so I can call it
  //inside of of the handlebars list-template for a recursive DOM template.
  Handlebars.registerPartial( "list", document.getElementById('list-template').innerHTML);

  /*keyboard key codes */
  var ENTER_KEY = 13;
  var ESCAPE_KEY = 27;
  var TAB_KEY = 9;

  /*Util Object methods.
   *  uuid = an object method that returns an id for each todolist item.
   *  store = an object method that uses localStorage to store todo array and fetch todo array.
   */

  var util = {

    uuid: function() {
      var i, random;
      var uuid = '';

      for (i = 0; i < 32; i++) {
        random = Math.random() * 16 | 0;
        if(i === 8 || i === 12 || i === 16 || i === 20) {
          uuid += '-';
        }
        uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
      }
      return uuid;
    },

    store: function(namespace, data) {
      if (arguments.length > 1) {
        return localStorage.setItem(namespace, JSON.stringify(data));
      } else {
        var store = localStorage.getItem(namespace);
        return (store && JSON.parse(store)) || [];
      }
    }
  };

  var app = {
    /**
    *app object method init().
    *
    * --> Retrieves stored local storage data.
    * --> Compiles the mainUlTemplate using innerHTML on the class 'main-ul'.
    * --> runs app.render().
    * --> runs app.bindEvents().
    */
    init: function() {
      this.todos = util.store('todos');
      this.mainUlTemplate = Handlebars.compile(document.getElementById('main-ul').innerHTML);
      this.render();
      this.bindEvents();
    },

    bindEvents: function() {
      document.querySelector('#newTodoButton').addEventListener('click', this.addInput.bind(this));

      document.querySelector('#clearCompleted').addEventListener('click', this.destroyCompleted.bind(this));

      // the preventDefault event method prevents the default event that occurs when the Tab key is pressed.
      document.querySelector('#todo-list').addEventListener('keydown', function(e) {
        if( e.which === TAB_KEY) {e.preventDefault(); app.tabIndent(e);}
      });

      document.querySelector('#todo-list').addEventListener('keydown', function(e) {
        if(e.target.localName === 'label' && e.which === ENTER_KEY) {app.update(e);}
      });

      document.querySelector('#todo-list').addEventListener('keyup', function(e) {
        if(e.target.className === 'new-todo') {app.create(e);}
      });

      document.querySelector('#todo-list').addEventListener('focusout', function(e) {
        if(e.target.localName === 'label' || e.target.className === 'new-todo') {app.update(e);}
      });

      document.querySelector('#todo-list').addEventListener('change', function(e) {
        if(e.target.className === 'toggle') {app.toggle(e);}
      });

      document.querySelector('#todo-list').addEventListener('click', function(e) {
        if(e.target.className === 'destroy'){app.destroy(e);}
      });
    },

    render: function() {
      var todos = this.todos;
      document.getElementById('todo-list').innerHTML = this.mainUlTemplate({todos});
      util.store('todos', todos);
    },

    /**
    *app object method.arrayFromEvent.
    *
    *  Takes an event and Recursively checks if closest id matches with an id in todos array .
    *  if not, will check nested nested todo arrays for a matching id.
    *  when id is found, will return a new array containing the todo array and index that matches the id.
    */

    arrayFromEvent: function(e, id) {
      if(id === undefined){
        var todos = app.todos;
        var id = e.target.closest('li').dataset.id;
      } else {
        var todos = e;
      }

      for (var i = 0; i < todos.length; i++) {
        if(todos[i].id === id) {
          return [todos, i];
        }
        if(todos[i].todos.length > 0) {
          var array = app.arrayFromEvent(todos[i].todos, id);
          if(array) {
            return array;
          }
        }
      }
    },

    create: function(e) {
      var input = e.target;
      var val = input.value.trim();
      var returnedArray = app.arrayFromEvent(e);
      var index = returnedArray[1];
      var todoArray = returnedArray[0];

      if (e.which !== ENTER_KEY) {
        return;
      }

      if(!val) {
        app.addInput(todoArray, index);
      } else {
        todoArray[index].title = val;
        todoArray[index].newInput = false;
        app.addInput(todoArray, index);
      }
    },

    toggle:function(e) {
      var returnedArray = app.arrayFromEvent(e);
      var index = returnedArray[1];
      var todoArray = returnedArray[0];

      todoArray[index].completed = !todoArray[index].completed;

      app.render();
    },

    update: function(e) {
      var returnedArray = app.arrayFromEvent(e);
      var index = returnedArray[1];
      var todoArray = returnedArray[0];
      var el = e.target;

      if(el.className === 'new-todo') {
        var val = el.value.trim();
        if(!val){return;}
        todoArray[index].newInput = false;
      } else {
        var val = el.innerText.trim();
      }

      if(todoArray[index].title === val) {
        if(e.which === ENTER_KEY) {
          app.addInput(todoArray, index);
        }
        return;
      } else {
        todoArray[index].title = val;
        if(e.which === ENTER_KEY) {
          app.addInput(todoArray, index);
          return;
        }
        app.render();
      }

    },

    destroy: function(e) {
      var returnedArray = app.arrayFromEvent(e);
      var index = returnedArray[1];
      var todoArray = returnedArray[0];

      todoArray.splice(index, 1);
      app.render();
    },

    destroyCompleted: function(eventOrArray) {
      if(eventOrArray.constructor === Array) {
        var array = eventOrArray;
      } else { var array = app.todos; }

      var todoArray = array.filter(function(el) {
        return !el.completed;
      });

      for(var i = 0; i < todoArray.length; i++) {
        if(todoArray[i].todos.length > 0) {
          todoArray[i].todos = app.destroyCompleted(todoArray[i].todos);
        }
      }

      if(eventOrArray.constructor === Array) {
        return todoArray;
      }

      app.todos = todoArray;
      app.render();
    },

    addInput: function(arrayOrEvent, index) {

      var todoObject = {
        id: util.uuid(),
        title: '',
        todos: [],
        completed: false,
        newInput: true,
      };

      if(index !== undefined) {
        index++
        arrayOrEvent.splice(index, 0, todoObject);
      } else {
        this.todos.push(todoObject);
      }

      this.render();
    },

    tabIndent: function(e) {
      if(e.which!== TAB_KEY) {
        return;
      }

      var returnedArray = app.arrayFromEvent(e);
      var index = returnedArray[1];
      var todoArray = returnedArray[0];

      if(index - 1 !== -1) {
        var previousIndex = index - 1;
        todoArray[previousIndex].todos.push(todoArray[index]);
        todoArray.splice(index, 1);
        app.render();
      }
    },

  };

  app.init();
