const utils = require('../testing-utils.js');

beforeEach(function(){
  require('../../jspsych.js');
  require('../../plugins/jspsych-html-keyboard-response.js');
})

describe('on_finish (trial)', function(){
  test('should get an object of data generated by the trial', function(){

    return (new Promise(function(resolve, reject){

      var key_data = null;

      var trial = {
        type: 'html-keyboard-response',
        stimulus: 'hello',
        on_finish: function(data){
          key_data = data.response;
        }
      }

      jsPsych.init({
        timeline: [trial],
        on_finish: function() {
          resolve({key_data});
        }
      });

      utils.pressKey('a');

    })).then(function(data) { expect(data.key_data).toBe('a') });
  });

  test('should be able to write to the data', function(){

    return (new Promise(function(resolve, reject){

      var promise_data = {};

      var trial = {
        type: 'html-keyboard-response',
        stimulus: 'hello',
        on_finish: function(data){
          data.response = 1;
        }
      }

      jsPsych.init({
        timeline: [trial],
        on_finish: function() {
          promise_data.final_key_press = jsPsych.data.get().values()[0].response;
          resolve(promise_data);
        }
      });

      utils.pressKey('a');

      //resolve();
    })).then(function(pd) {
      expect(pd.final_key_press).toBe(1);
    });
  });
});

describe('on_start (trial)', function(){

  test('should get trial data with function parameters evaluated', function(){
    
    return (new Promise(function(resolve, reject){

      var d = null;

      var trial = {
        type: 'html-keyboard-response',
        stimulus: function(){ return 'hello'; },
        on_start: function(trial){
          d = trial.stimulus;
        }
      }

      jsPsych.init({
        timeline: [trial],
        on_finish: function() {
          resolve(d);
        }
      });

      utils.pressKey('a');

    })).then(function(data) { expect(data).toBe('hello') });
  });

  test('should get trial data with timeline variables evaluated', function(){
    
    return (new Promise(function(resolve, reject){

      var d = null;

      var trial = {
        timeline: [{
          type: 'html-keyboard-response',
          stimulus: jsPsych.timelineVariable('stimulus'),
          on_start: function(trial){
            d = trial.stimulus;
          }
        }],
        timeline_variables: [{stimulus: 'hello'}]
      }

      jsPsych.init({
        timeline: [trial],
        on_finish: function() {
          resolve(d);
        }
      });

      utils.pressKey('a');

    })).then(function(data) { expect(data).toBe('hello') });
  });
})

describe('on_trial_finish (experiment level)', function(){
  test('should get an object containing the trial data', function(){
    
    return (new Promise(function(resolve, reject){

      var promise_data = {};

      var trial = {
        type: 'html-keyboard-response',
        stimulus: 'hello'
      }

      jsPsych.init({
        timeline: [trial],
        on_trial_finish: function(data){
          promise_data.key = data.response;
        },
        on_finish: function(){
          resolve(promise_data);
        }
      });

      utils.pressKey('a');

      //resolve();
    })).then(function(pd) {
      expect(pd.key).toBe('a');
    });
  });

  test('should allow writing to the data object', function(){
    
    return (new Promise(function(resolve, reject){

      var promise_data = {};

      var trial = {
        type: 'html-keyboard-response',
        stimulus: 'hello'
      }

      jsPsych.init({
        timeline: [trial],
        on_trial_finish: function(data){
          data.write = true;
        },
        on_finish: function(data){
          promise_data.write = data.values()[0].write;
          resolve(promise_data);
        }
      });

      utils.pressKey('a');

      //resolve();
    })).then(function(pd) {
      expect(pd.write).toBe(true);
    });
  });
});

describe('on_data_update', function(){
  test('should get an object containing the trial data', function(){
    
    return (new Promise(function(resolve, reject){

      var promise_data = {};

      var trial = {
        type: 'html-keyboard-response',
        stimulus: 'hello'
      }

      jsPsych.init({
        timeline: [trial],
        on_data_update: function(data){
          promise_data.key = data.response;
        },
        on_finish: function(){
          resolve(promise_data);
        }
      });

      utils.pressKey('a');

      //resolve();
    })).then(function(pd) {
      expect(pd.key).toBe('a');
    });
  });

  test('should contain data with null values', function(){

    require('../../plugins/jspsych-html-slider-response.js');
    
    return (new Promise(function(resolve, reject){

      var promise_data = [];

      var trial = {
        type: 'html-keyboard-response',
        stimulus: 'hello',
        trial_duration: 10
      }

      var trial_2 = {
        type: 'html-slider-response',
        stimulus: 'hello',
        trial_duration: 10
      }

      jsPsych.init({
        timeline: [trial, trial_2],
        on_data_update: function(data){
          promise_data.push(data);
        },
        on_finish: function(){
          resolve(promise_data);
        }
      });

      //resolve();
    })).then(function(pd) {
      expect(pd[0].response).not.toBeUndefined();
      expect(pd[0].response).toBeNull();
      expect(pd[1].response).toBeNull();
      expect(pd[1].rt).toBeNull();
    });
  });

  test('should contain data added with on_finish (trial level)', function(){
    
    return (new Promise(function(resolve, reject){

      var promise_data = {};

      var trial = {
        type: 'html-keyboard-response',
        stimulus: 'hello',
        on_finish: function(data){
          data.trial_level = true;
        }
      }

      jsPsych.init({
        timeline: [trial],
        on_data_update: function(data){
          promise_data.trial_level = data.trial_level;
        },
        on_finish: function(){
          resolve(promise_data);
        }
      });

      utils.pressKey('a');

      //resolve();
    })).then(function(pd) {
      expect(pd.trial_level).toBe(true);
    });
  });

  test('should contain data added with on_trial_finish (experiment level)', function(){
    
    return (new Promise(function(resolve, reject){

      var promise_data = {};

      var trial = {
        type: 'html-keyboard-response',
        stimulus: 'hello'
      }

      jsPsych.init({
        timeline: [trial],
        on_trial_finish: function(data){
          data.experiment_level = true;
        },
        on_data_update: function(data){
          promise_data.experiment_level = data.experiment_level;
        },
        on_finish: function(){
          resolve(promise_data);
        }
      });

      utils.pressKey('a');

      //resolve();
    })).then(function(pd) {
      expect(pd.experiment_level).toBe(true);
    });
  });
});

describe('on_trial_start', function(){

  test('should get an object containing the trial properties', function(){
    
    return (new Promise(function(resolve, reject){

      var promise_data = {};

      var trial = {
        type: 'html-keyboard-response',
        stimulus: 'hello'
      }

      jsPsych.init({
        timeline: [trial],
        on_trial_start: function(trial){
          promise_data.text = trial.stimulus;
        },
        on_finish: function(){
          resolve(promise_data);
        }
      });

      utils.pressKey('a');

      //resolve();
    })).then(function(pd) {
      expect(pd.text).toBe('hello');
    });
  });

  test('should allow modification of the trial properties', function(){
    
    var trial = {
      type: 'html-keyboard-response',
      stimulus: 'hello'
    }

    jsPsych.init({
      timeline: [trial],
      on_trial_start: function(trial){
        trial.stimulus = 'goodbye';
      }
    });

    var display_element = jsPsych.getDisplayElement();
    expect(display_element.innerHTML).toMatch('goodbye');

    utils.pressKey('a');
  });
});

describe('on_timeline_finish', function(){
  test('should fire once when timeline is complete', function(){

    var on_finish_fn = jest.fn();

    var mini_timeline = {
      timeline: [
        {
          type: 'html-keyboard-response',
          stimulus: 'foo'
        },
        {
          type: 'html-keyboard-response',
          stimulus: 'foo'
        },
        {
          type: 'html-keyboard-response',
          stimulus: 'foo'
        }
      ],
      on_timeline_finish: on_finish_fn
    }

    jsPsych.init({timeline: [mini_timeline]});

    utils.pressKey('a');
    expect(on_finish_fn).not.toHaveBeenCalled();
    utils.pressKey('a');
    expect(on_finish_fn).not.toHaveBeenCalled();
    utils.pressKey('a');
    expect(on_finish_fn).toHaveBeenCalled();
  });

  test('should fire once even with timeline variables', function(){

    var on_finish_fn = jest.fn();

    var tvs = [
      {x: 1},
      {x: 2},
    ]

    var mini_timeline = {
      timeline: [
        {
          type: 'html-keyboard-response',
          stimulus: 'foo'
        }
      ],
      on_timeline_finish: on_finish_fn,
      timeline_variables: tvs
    }

    jsPsych.init({timeline: [mini_timeline]});

    utils.pressKey('a');
    utils.pressKey('a');
    expect(on_finish_fn.mock.calls.length).toBe(1);
    
  })

  test('should fire on every repetition', function(){

    var on_finish_fn = jest.fn();

    var mini_timeline = {
      timeline: [
        {
          type: 'html-keyboard-response',
          stimulus: 'foo'
        }
      ],
      on_timeline_finish: on_finish_fn,
      repetitions: 2
    }

    jsPsych.init({timeline: [mini_timeline]});

    utils.pressKey('a');
    utils.pressKey('a');
    expect(on_finish_fn.mock.calls.length).toBe(2);
    
  })

  test('should fire before a loop function', function(){

    var callback = jest.fn().mockImplementation(function(str) {return str;});
    var count = 0;

    var mini_timeline = {
      timeline: [
        {
          type: 'html-keyboard-response',
          stimulus: 'foo'
        }
      ],
      on_timeline_finish: function() {callback('finish');},
      loop_function: function() {
        callback('loop');
        count++;
        if (count==2) {
          return false;
        } else {
          return true;
        }
      }
    }

    jsPsych.init({timeline: [mini_timeline]});

    utils.pressKey('a');
    utils.pressKey('a');
    expect(callback.mock.calls.length).toBe(4);
    expect(callback.mock.calls[0][0]).toBe('finish');
    expect(callback.mock.calls[1][0]).toBe('loop');
    expect(callback.mock.calls[2][0]).toBe('finish');
    expect(callback.mock.calls[3][0]).toBe('loop');
    
  })

})

describe('on_timeline_start', function(){
  test('should fire once when timeline starts', function(){

    var on_start_fn = jest.fn();

    var mini_timeline = {
      timeline: [
        {
          type: 'html-keyboard-response',
          stimulus: 'foo'
        },
        {
          type: 'html-keyboard-response',
          stimulus: 'foo'
        },
        {
          type: 'html-keyboard-response',
          stimulus: 'foo'
        }
      ],
      on_timeline_start: on_start_fn
    }

    jsPsych.init({timeline: [mini_timeline]});

    expect(on_start_fn).toHaveBeenCalled();
    utils.pressKey('a');
    utils.pressKey('a');
    utils.pressKey('a');
    expect(on_start_fn.mock.calls.length).toBe(1);
    
  })

  test('should fire once even with timeline variables', function(){

    var on_start_fn = jest.fn();

    var tvs = [
      {x: 1},
      {x: 2},
    ]

    var mini_timeline = {
      timeline: [
        {
          type: 'html-keyboard-response',
          stimulus: 'foo'
        }
      ],
      on_timeline_start: on_start_fn,
      timeline_variables: tvs
    }

    jsPsych.init({timeline: [mini_timeline]});

    expect(on_start_fn).toHaveBeenCalled();
    utils.pressKey('a');
    utils.pressKey('a');
    expect(on_start_fn.mock.calls.length).toBe(1);
    
  })

  test('should fire on every repetition', function(){

    var on_start_fn = jest.fn();

    var mini_timeline = {
      timeline: [
        {
          type: 'html-keyboard-response',
          stimulus: 'foo'
        }
      ],
      on_timeline_start: on_start_fn,
      repetitions: 2
    }

    jsPsych.init({timeline: [mini_timeline]});

    expect(on_start_fn).toHaveBeenCalled();
    utils.pressKey('a');
    utils.pressKey('a');
    expect(on_start_fn.mock.calls.length).toBe(2);
    
  })

  test('should fire after a conditional function', function(){

    var callback = jest.fn().mockImplementation(function(str) {return str;});

    var mini_timeline = {
      timeline: [
        {
          type: 'html-keyboard-response',
          stimulus: 'foo'
        }
      ],
      on_timeline_start: function() {callback('start');},
      conditional_function: function() {
        callback('conditional');
        return true;
      }
    }

    jsPsych.init({timeline: [mini_timeline]});

    expect(callback.mock.calls.length).toBe(2);
    expect(callback.mock.calls[0][0]).toBe("conditional");
    expect(callback.mock.calls[1][0]).toBe("start");
    utils.pressKey('a');
    
  })

})