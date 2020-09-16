/**
 * jspsych-listen-up
 * plugin for Listen Up task: xab with audio, image, and button responses
 * Becky Gilbert, July 2019
 * 
 * Adapted from jspsych-audio-button-response by Kristin Diep
 * plugin for playing an audio file and getting a keyboard response
 * documentation: docs.jspsych.org
 *
 **/

jsPsych.plugins["listen-up"] = (function() {
	var plugin = {};

	//jsPsych.pluginAPI.registerPreload('listen-up', 'stimuli', 'audio'); 

	plugin.info = {
		name: 'listen-up',
		description: '',
		parameters: {
			stimuli: {
				type: jsPsych.plugins.parameterType.AUDIO,
        pretty_name: 'Stimuli',
				default: undefined,
        array: true,
				description: 'The sequence of audio files to play.'
			},
      stimuli_timing: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Stimuli timing',
        default: [0],
        array: true,
        description: 'Delay(s) in ms between audio files.'
      },
			choices: {
				type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Choices',
				default: undefined,
				array: true,
				description: 'The button labels corresponding to options 1 and 2.'
			},
      button_html_default: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        pretty_name: 'Button HTML',
        default: '<button class="jspsych-btn">%choice%</button>',
        array: true,
        description: 'Custom button HTML for when the audio is not playing for the corresponding choice.'
      },
      button_html_audio: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        pretty_name: 'Button HTML',
        default: '<button class="jspsych-btn">%choice%</button>',
        array: true,
        description: 'Custom button HTML for when audio plays for the corresponding choice.'
      },
      disable_buttons_during_audio: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Disable buttons during audio',
        default: true,
        description: 'Should the buttons be disabled until the last audio file stops playing?'
      },
      prompt: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt',
        default: null,
        description: 'Any content here will be displayed above the buttons.'
      },
      trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Trial duration',
        default: null,
        description: 'The maximum duration to wait for a response.'
      },
      margin_vertical: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Margin vertical',
        default: '0px',
        description: 'Vertical margin of button.'
      },
      margin_horizontal: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Margin horizontal',
        default: '8px',
        description: 'Horizontal margin of button.'
      },
      response_ends_trial: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Response ends trial',
        default: true,
        description: 'If true, the trial will end when user makes a response.'
      },
      trial_ends_after_audio: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Trial ends after audio',
        default: false,
        description: 'If true, then the trial will end as soon as the last audio file finishes playing.'
      },
    }
  };

  plugin.trial = function(display_element, trial) {

    document.getElementById('jspsych-content').style.marginTop = "0px";

    var page_load_start = performance.now();
    var audio_ready = false;
    var page_ready = false;
    // start loading the audio files (async)
    // when finished, change the audio_ready variable to true and start the trial if the page is ready
    jsPsych.pluginAPI.preloadAudioFiles(trial.stimuli, change_audio_ready_state);

    function change_audio_ready_state() {
      audio_ready = true;
      if (page_ready) {
        start_trial();
      }
    }

    var audio_count = 0;
    var audio_choice_count = 0;
    var start_time;

    // check parameters and set defaults
    // set up the stimuli timing array
    if (trial.stimuli_timing === null) {
      trial.stimuli_timing = Array(trial.stimuli.length).fill(plugin.info.parameters.stimuli_timing.default[0]);
    } else {
      if (trial.stimuli_timing.length < trial.stimuli.length) {
        if (trial.stimuli_timing.length == 1) {
          trial.stimuli_timing = Array(trial.stimuli.length).fill(trial.stimuli_timing[0]);
        } else {
          console.error('Error in listen-up plugin. The length of the stimuli_timing array must be either 1 or equal to the length of the stimuli array.');
        }
      }
    }

    // setup first stimuli
    var source, audio, method;
    var context = jsPsych.pluginAPI.audioContext();
    if (context !== null) {
      method = "web_audio";
    } else {
      method = "html_audio";
    }

  	//display buttons
    var buttons = [];
    if (Array.isArray(trial.button_html_default)) {
      if (trial.button_html_default.length == trial.choices.length) {
        buttons = trial.button_html_default;
      } else {
        console.error('Error in listen-up plugin. The length of the button_html array does not equal the length of the choices array');
      }
    } else {
      for (var i = 0; i < trial.choices.length; i++) {
        buttons.push(trial.button_html_default);
      }
    }

    var html = '';
    //show prompt
    if (trial.prompt !== null) {
      html += trial.prompt;
    }

    html += '<div id="jspsych-audio-button-response-btngroup">';
    for (var i = 0; i < trial.choices.length; i++) {
      var str = buttons[i].replace(/%choice%/g, trial.choices[i]);
      html += '<div class="jspsych-audio-button-response-button" style="cursor: pointer; display: inline-block; margin:'+trial.margin_vertical+' '+trial.margin_horizontal+'" id="jspsych-audio-button-response-button-' + i +'" data-choice="'+i+'">'+str+'</div>';
    }
		html += '</div>';

		display_element.innerHTML = html;

    if (trial.disable_buttons_during_audio) {
      var btn_grp = display_element.querySelector("#jspsych-audio-button-response-btngroup");
      btn_grp.classList.add("no-cursor");
    }

		for (var i = 0; i < trial.choices.length; i++) {
      var curr_btn_div = display_element.querySelector('#jspsych-audio-button-response-button-' + i);
      if (trial.disable_buttons_during_audio) {
        curr_btn_div.getElementsByTagName('button')[0].setAttribute('disabled', 'disabled');
      } else {
        curr_btn_div.addEventListener('click', function(e) {
          var choice = e.currentTarget.getAttribute('data-choice'); // don't use dataset for jsdom compatibility
          after_response(choice);
        });
      }
    }

    // store response
    var response = {
      rt: null,
      button: null
    };

    // function to handle responses by the subject
    function after_response(choice) {

      // measure rt
      var end_time = performance.now();
      var rt = end_time - start_time;
      response.button = choice;
      response.rt = rt;

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

    // function to end trial when it is time
    function end_trial() {

			// stop the audio file if it is playing
			// remove end event listeners if they exist
			if (context !== null) {
				source.stop();
				source.onended = function() { };
			} else {
				audio.pause();
				audio.removeEventListener('ended', end_trial);
			}

      // kill any remaining setTimeout handlers
      jsPsych.pluginAPI.clearAllTimeouts();

      // gather the data to store for the trial
      var trial_data = {
        "rt": response.rt,
        "button_pressed": response.button
      };

      // clear the display
      display_element.innerHTML = '';

      // move on to the next trial
      jsPsych.finishTrial(trial_data);
    }

    // set up audio and onended callback (helper function)
    // function set_up_audio(method, is_target_stim, is_last_stim) {
    //   if (method == "web_audio") {
    //     source = context.createBufferSource();
    //     source.buffer = jsPsych.pluginAPI.getAudioBuffer(trial.stimuli[audio_count]);
    //     source.connect(context.destination);
    //     if (is_last_stim) {
    //       source.onended = function() {
    //         setTimeout(enable_buttons, trial.stimuli_timing[audio_count]);
    //         if (!is_target_sound) {
    //           change_button_to_default(audio_choice_count-1);
    //         }
    //       };
    //   } else {

    //   }
    // }

    // create the audio onended function (helper function)
    function create_onended_fn(is_target_sound, is_last_stim) {
      var onended_fn;
      if (!is_target_sound) { // audio is one of the choices
        if (is_last_stim) {
          onended_fn = function() {
            setTimeout(enable_buttons, trial.stimuli_timing[audio_count]);
            change_button_to_default(audio_choice_count-1);
          };
        } else {
          onended_fn = function() {
            setTimeout(play_next, trial.stimuli_timing[audio_count]);
            change_button_to_default(audio_choice_count-1);
          };
        }
      } else { // audio is the target/reference stim
        onended_fn = function() {
          setTimeout(play_next, trial.stimuli_timing[audio_count]);
        };
      }
      return onended_fn; 
    }

		// function to start next audio
    function play_next() {
      // is this the first sound file (target) or not (one of the choices)?
      var is_target_sound = false;
      if (audio_count === 0) {
        is_target_sound = true;
      }
      // is this the last of the audio choices?
      var is_last_stim = false;
      if (audio_count+1 >= trial.stimuli.length) {
        is_last_stim = true;
      }
      // create the on_ended function for this stim
      var curr_onended_fn = create_onended_fn(is_target_sound, is_last_stim);

      // set up and play next audio
      if (method == "web_audio") {
        source = context.createBufferSource();
        source.buffer = jsPsych.pluginAPI.getAudioBuffer(trial.stimuli[audio_count]);
        source.connect(context.destination);
        source.onended = curr_onended_fn;
        startTime = context.currentTime;
        source.start(startTime);
      } else { // HTML audio
        audio = jsPsych.pluginAPI.getAudioBuffer(trial.stimuli[audio_count]);
        audio.currentTime = 0;
        audio.addEventListener('ended', curr_onended_fn);
        audio.play();
      }

      // if this isn't the first audio file, then change the button HTML for the last button
      if (audio_count >= 1) {
        change_button_to_audio(audio_choice_count);
        audio_choice_count++;
      }
      audio_count++;
    }

    // function to enable buttons for response
    function enable_buttons() {
      var btn_grp = display_element.querySelector("#jspsych-audio-button-response-btngroup");
      btn_grp.classList.remove("no-cursor");
      for (var i = 0; i < trial.choices.length; i++) {
        var curr_btn_div = display_element.querySelector('#jspsych-audio-button-response-button-' + i);
        curr_btn_div.addEventListener('click', function(e) {
          var choice = e.currentTarget.getAttribute('data-choice'); // don't use dataset for jsdom compatibility
          after_response(choice);
        });
        curr_btn_div.getElementsByTagName('button')[0].disabled = false;
      }
    }

    // functions to change button HTML
    function change_button_to_audio(btn_index) {
      var btn_html_aud = trial.button_html_audio[btn_index].replace(/%choice%/g, trial.choices[btn_index]);
      var btns = document.querySelectorAll('div.jspsych-audio-button-response-button');
      btns[btn_index].innerHTML = btn_html_aud;
      btns[btn_index].getElementsByTagName('button')[0].disabled = true;
    }

    function change_button_to_default(btn_index) {
      var btns = document.querySelectorAll('div.jspsych-audio-button-response-button');
      btns[btn_index].innerHTML = trial.button_html_default[btn_index];
      btns[btn_index].getElementsByTagName('button')[0].disabled = true;
    }

    // end trial if time limit is set
    if (trial.trial_duration !== null) {
      jsPsych.pluginAPI.setTimeout(function() {
        end_trial();
      }, trial.trial_duration);
    }

    function start_trial() {
      // trial start time
      start_time = performance.now();
      // start first audio
      play_next();
    }

    page_ready = true;

    if (audio_ready) {
      start_trial();
    } else { //  else: try a few more times?
      //console.log('page loaded, audio not ready');
    }

  };

  return plugin;
})();
