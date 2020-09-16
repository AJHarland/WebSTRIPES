/**
 * jspsych-audio-button-response
 * Josh de Leeuw
 *
 * plugin for playing an audio file and getting a button response
 *
 * documentation: docs.jspsych.org
 *
 **/

jsPsych.plugins["audio-button-response"] = (function() {

  var plugin = {};

  jsPsych.pluginAPI.registerPreload('audio-button-response', 'stimulus', 'audio');

  plugin.info = {
    name: 'audio-button-response',
    description: '',
    parameters: {
      sources: {
        type: jsPsych.plugins.parameterType.AUDIO,
        pretty_name: 'Sources',
        default: undefined,
        description: 'The audio file to play.'
      },
      choices: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Choices',
        default: undefined,
        array: true,
        description: 'The labels for the buttons.'
      },
      button_html: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Button HTML',
        default: '<button class="jspsych-btn">%choice%</button>',
        array: true,
        description: 'The html of the button. Can create own style.'
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt',
        default: null,
        description: 'Any content here will be displayed below the buttons.'
      },
      autoplay: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Autoplay',
        default: true,
        description: 'If true, the audio will begin playing as soon as it has loaded.'
      },
      controls: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Controls',
        default: false,
        description: 'If true, the subject will be able to pause the audio or move the playback to any point in the audio.'
      },
      start: {
        type: jsPsych.plugins.parameterType.FLOAT,
        pretty_name: 'Start',
        default: null,
        description: 'Time to start the audio.'
      },
      stop: {
        type: jsPsych.plugins.parameterType.FLOAT,
        pretty_name: 'Stop',
        default: null,
        description: 'Time to stop the audio.'
      },
      rate: {
        type: jsPsych.plugins.parameterType.FLOAT,
        pretty_name: 'Rate',
        default: 1,
        description: 'The playback rate of the audio. 1 is normal, <1 is slower, >1 is faster.'
      },
      trial_ends_after_audio: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Trial ends after audio',
        default: false,
        description: 'If true, the trial will end immediately after the audio finishes playing.'
      },
      trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Trial duration',
        default: null,
        description: 'How long to show trial before it ends.'
      },
      margin_vertical: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Margin vertical',
        default: '0px',
        description: 'The vertical margin of the button.'
      },
      margin_horizontal: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Margin horizontal',
        default: '8px',
        description: 'The horizontal margin of the button.'
      },
      response_ends_trial: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Response ends trial',
        default: true,
        description: 'If true, the trial will end when subject makes a response.'
      }
    }
  };

  plugin.trial = function(display_element, trial) {

    // setup stimulus
    var audio_html = '<div>';
    audio_html += '<audio id="jspsych-audio-button-response-stimulus"';

    if(trial.autoplay){
      audio_html += " autoplay ";
    }
    if(trial.controls){
      audio_html +=" controls ";
    }
    audio_html +=">";

    var audio_preload_blob = jsPsych.pluginAPI.getAudioBuffer(trial.sources[0]);
    // if(!audio_preload_blob) {
      for(var i=0; i<trial.sources.length; i++){
        var file_name = trial.sources[i];
        if(file_name.indexOf('?') > -1){
          file_name = file_name.substring(0, file_name.indexOf('?'));
        }
        var type = file_name.substr(file_name.lastIndexOf('.') + 1);
        type = type.toLowerCase();
        audio_html+='<source src="' + file_name + '" type="audio/'+type+'">';   
      }
    // }
    audio_html += "</audio>";
    audio_html += "</div>";

    //display buttons
    var buttons = [];
    if (Array.isArray(trial.button_html)) {
      if (trial.button_html.length == trial.choices.length) {
        buttons = trial.button_html;
      } else {
        console.error('Error in audio-button-response plugin. The length of the button_html array does not equal the length of the choices array');
      }
    } else {
      for (var i = 0; i < trial.choices.length; i++) {
        buttons.push(trial.button_html);
      }
    }
    audio_html += '<div id="jspsych-audio-button-response-btngroup">';
    for (var i = 0; i < trial.choices.length; i++) {
      var str = buttons[i].replace(/%choice%/g, trial.choices[i]);
      audio_html += '<div class="jspsych-audio-button-response-button" style="display: inline-block; margin:'+trial.margin_vertical+' '+trial.margin_horizontal+'" id="jspsych-audio-button-response-button-' + i +'" data-choice="'+i+'">'+str+'</div>';
    }
    audio_html += '</div>';

    // add prompt if there is one
    if (trial.prompt !== null) {
      audio_html += trial.prompt;
    }

    display_element.innerHTML = audio_html;
    
    var start_time = performance.now();

    // if(audio_preload_blob){
    //   display_element.querySelector('#jspsych-audio-button-response-stimulus').src = audio_preload_blob;
    // }

    display_element.querySelector('#jspsych-audio-button-response-stimulus').onended = function(){
      if(trial.trial_ends_after_audio){
        end_trial();
      }
    };

    if(trial.start !== null){
      display_element.querySelector('#jspsych-audio-button-response-stimulus').currentTime = trial.start;
    }

    if(trial.stop !== null){
      display_element.querySelector('#jspsych-audio-button-response-stimulus').addEventListener('timeupdate', function(e){
        var currenttime = display_element.querySelector('#jspsych-audio-button-response-stimulus').currentTime;
        if(currenttime >= trial.stop){
          display_element.querySelector('#jspsych-audio-button-response-stimulus').pause();
        }
      });
    }

    display_element.querySelector('#jspsych-audio-button-response-stimulus').playbackRate = trial.rate;

    // add event listeners to buttons
    for (var i = 0; i < trial.choices.length; i++) {
      display_element.querySelector('#jspsych-audio-button-response-button-' + i).addEventListener('click', function(e){
        var choice = e.currentTarget.getAttribute('data-choice'); // don't use dataset for jsdom compatibility
        after_response(choice);
      });
    }

    // store response
    var response = {
      rt: null,
      button: null
    };

    // function to end trial when it is time
    function end_trial() {

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // gather the data to store for the trial
      var trial_data = {
        "rt": response.rt,
        "sources": trial.sources,
        "button_pressed": response.button
      };

      // clear the display
      display_element.innerHTML = '';

      // move on to the next trial
      jsPsych.finishTrial(trial_data);
    }

    // function to handle responses by the subject
    function after_response(choice) {

      // measure rt
      var end_time = performance.now();
      var rt = end_time - start_time;
      response.button = choice;
      response.rt = rt;

      // after a valid response, the stimulus will have the CSS class 'responded'
      // which can be used to provide visual feedback that a response was recorded
      display_element.querySelector('#jspsych-audio-button-response-stimulus').className += ' responded';

      // disable all the buttons after a response
      var btns = document.querySelectorAll('.jspsych-audio-button-response-button button');
      for(var i=0; i<btns.length; i++){
        //btns[i].removeEventListener('click');
        btns[i].setAttribute('disabled', 'disabled');
      }

      if (trial.response_ends_trial) {
        end_trial();
      }
    }

    // end trial if time limit is set
    if (trial.trial_duration !== null) {
      jsPsych.pluginAPI.setTimeout(function() {
        end_trial();
      }, trial.trial_duration);
    }
  };

  return plugin;
})();
