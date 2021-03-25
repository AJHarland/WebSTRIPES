/**
 * jspsych-stripes
 * Plugin for STRIPES task: AXB with audio and button responses
 * Plays 3 sounds, and lights up a button for each. The participant chooses either the 1st or 3rd sound as their response.
 * Responses are made with a button press.
 * Becky Gilbert, Aug 2020
 * 
 * Adapted from jspsych-audio-button-response by Kristin Diep
 * plugin for playing an audio file and getting a keyboard response
 * documentation: docs.jspsych.org
 *
 **/

jsPsych.plugins["stripes"] = (function() {
	var plugin = {};

	//jsPsych.pluginAPI.registerPreload('stripes', 'stimuli', 'audio'); 

	plugin.info = {
		name: 'stripes',
		description: '',
		parameters: {
			stimuli: {
				type: jsPsych.plugins.parameterType.AUDIO,
        pretty_name: 'stimuli',
        default: undefined,
        array: true,
        description: 'The audio files to play. The first file is the correct response, the second and third files are incorrect. '+
          'The order that these files play in is determined by the correct_choice parameter.'
			},
      stimuli_timing: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Stimuli timing',
        default: [0],
        array: true,
        description: 'Delay(s) in ms before/between each audio presentation. ' +
          'Should be an array with 4 elements (1 delay duration at the start and 3 delay durations per sound presentation) '+
          'or 1 element (same delay duration at the start and between all sounds).'
      },
			choices: {
				type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Choices',
				default: ["A","X","B"],
				array: true,
        description: 'The button labels corresponding to the sounds A, X and B. ' +
          'Note that the 2nd "X" option is not a response option - this button will appear but remain disabled.'
      },
      correct_choice: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Correct choice',
        default: undefined,
        array: false,
        description: 'The correct response on this trial, either "A" (first sound) or "B" (third sound). This value determines the order that the sounds in'+
          'the stimuli parameter will play.'
      },
      /* ended up implementing them outside the plugin - redundant 
      density: {
        type: jsPsych.plugins.parameterType.FLOAT,
        pretty_name: 'Density',
        default: 1,
        array: false,
        description: 'Density level (floating point) used for adjusting the stripe density.'
      },
      rove: {
        type: jsPsych.plugins.parameterType.FLOAT,
        pretty_name: 'Rove',
        default: 1,
        array: false,
        description: 'Rove level (floating point) used for adjusting the task.'
      }, */

      button_html_off: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        pretty_name: 'Button HTML for sound off',
        default: ['<button class="jspsych-btn stripes-btn stripes-audio-off stripes-btn-target">%choice%</button>', '<button class="jspsych-btn stripes-btn stripes-audio-off stripes-btn-reference">%choice%</button>', '<button class="jspsych-btn stripes-btn stripes-audio-off stripes-btn-target">%choice%</button>'],
        array: true,
        description: 'Custom button HTML for when the audio is not playing for the corresponding choice. ' +
          'Should be an array with 3 elements (1 button HTML string per A/X/B sound) '+
          'or 1 element (same button HTML string for all sounds).'
      },
      button_html_on: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        pretty_name: 'Button HTML for sound on',
        default: ['<button class="jspsych-btn stripes-btn stripes-audio-on stripes-btn-target">%choice%</button>', '<button class="jspsych-btn stripes-btn stripes-audio-on stripes-btn-reference">%choice%</button>', '<button class="jspsych-btn stripes-btn stripes-audio-on stripes-btn-target">%choice%</button>'],
        array: true,
        description: 'Custom button HTML for when audio plays for the corresponding choice. ' +
          'Should be an array with 3 elements (1 button HTML string per A/X/B sound) '+
          'or 1 element (same button HTML string for all sounds).'
      },
      disable_buttons_during_audio: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Disable buttons during audio',
        default: true,
        description: 'Should the A and B buttons be disabled until the last audio file stops playing?'
      },
      prompt_audio: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt during audio',
        default: null,
        description: 'HTML-formatted string that will be displayed above the buttons while the audio is playing.'
      },
      prompt_response: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Prompt during response',
        default: null,
        description: 'HTML-formatted string that will be displayed above the buttons after the audio has ' +
          'finished playing, while waiting for a response.'
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
        default: '30px',
        description: 'Vertical margin of button, i.e. spacing between buttons and content above/below.'
      },
      margin_horizontal: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Margin horizontal',
        default: '50px',
        description: 'Horizontal margin of button, i.e. left/right spacing between buttons.'
      },
      response_ends_trial: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Response ends trial',
        default: true,
        description: 'If true, the trial will end when the participant makes a response.'
      },
      trial_ends_after_audio: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Trial ends after audio',
        default: false,
        description: 'If true, then the trial will end as soon as the last audio file finishes playing.'
      },
      show_answer: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Show answer',
        default: false,
        description: 'Whether or not show which A/B buttons are correct/incorrect throughout the trial.'
      },
      answer_correct_style: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Answer correct style',
        default: 'background-color: limegreen;',
        description: 'If show_answer is true, this is the CSS style that will be used for the correct choice button (A or B).'
      },
      answer_incorrect_style: {
        type: jsPsych.plugins.parameterType.STRING,
        pretty_name: 'Answer incorrect style',
        default: 'background-color: rgb(187,187,187);', // red is (255,90,90), dark grey is (133,133,133)
        description: 'If show_answer is true, this is the CSS style that will be used for the incorrect choice button (A or B).'
      },
      show_feedback: {
        type: jsPsych.plugins.parameterType.BOOL,
        pretty_name: 'Show feedback',
        default: false,
        description: 'Whether or not show correct/incorrect feedback after a response or trial duration timeout.'
      }, 
      feedback_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: 'Feedback duration',
        default: 2000,
        description: 'If show_feedback is true, this is the duration (in ms) to show the correct/incorrect feedback stimulus.'
      },
      feedback_correct_html: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        pretty_name: 'Feedback correct HTML',
        default: '<span id="feedback-corr" class="feedback" style="color: limegreen;">Correct!</span>',
        description: 'HTML-formatted string that will be displayed after a correct response, if show_feedback is true.'
      },
      feedback_incorrect_html: {
        type: jsPsych.plugins.parameterType.HTML_STRING,
        pretty_name: 'Feedback incorrect HTML',
        default: '<span id="feedback-incorr" class="feedback" style="color: rgb(255,90,90);">Incorrect</span>',
        description: 'HTML-formatted string that will be displayed after an incorrect response, if show_feedback is true.'
      }
    }
  };

  plugin.trial = function(display_element, trial) {

    // initialize globals 
    var html = '';
    var audio_array = [];
    var audio_count = 0;
    var start_time;
    var source, audio, method;
    var context = jsPsych.pluginAPI.audioContext();
    if (context !== null) {
      method = "web_audio";
    } else {
      method = "html_audio";
    }

    //document.getElementById('jspsych-content').style.marginTop = "20px";

    // The commented-out chunk of code below is related to loading the audio file(s) at the start of each trial, 
    // instead of preloading everything at the start of the experiment.
    // This code might be useful if you need to create a large set of audio files that correspond to difficulty levels,
    // and don't know in advance which specific files you need (e.g. because you're using a staircase procedure).
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

    // check parameters and set defaults
    // stimuli array
    if (trial.stimuli.length !== 3) {
      console.error('Error in stripes plugin. The stimuli must be an array with 3 audio files.')
    } 

    // set up the stimuli timing array
    if (trial.stimuli_timing === null) {
      // if stimuli_timing isn't specified then use the default value and repeat for all 3 sounds
      trial.stimuli_timing = Array(4).fill(plugin.info.parameters.stimuli_timing.default[0]);
    } else if (!Array.isArray(trial.stimuli_timing) || trial.stimuli_timing.length !== 4) {
      console.error('Error in stripes plugin. The length of the stimuli_timing array must be either 1 (same start and post-stimulus delay duration for each sound) or 4 (one starting delay and 3 delay durations per A/X/B sound).');
    } else if (trial.stimuli_timing.length == 1) {
      // if only one value is specified, then use it for all 3 sounds
      trial.stimuli_timing = Array(4).fill(trial.stimuli_timing[0]);
    } 

  	// set up button HTML parameters for each sound/button
    // for 'off' state (sound not playing)
    if (typeof trial.button_html_off === null) {
      // if button_html_off isn't specified then use the default value for all 3 buttons
      trial.button_html_off = Array(3).fill(plugin.info.parameters.button_html_off) 
    } else if (!Array.isArray(trial.button_html_off) | (trial.button_html_off.length !== 1 & trial.button_html_off.length !== 3)) {
      console.error('Error in stripes plugin. button_html_off must be an array with length of either 1 (same HTML string for each button) or 3 (one HTML string per A/X/B button).');
    } else if (trial.button_html_off.length == 1) {
      // if only one value is specified, then use it for all 3 buttons
      trial.button_html_off = Array(3).fill(trial.button_html_off[0])
    } 
    // for 'on' state (sound playing)
    if (typeof trial.button_html_on === null) {
      // if button_html_on isn't specified then use the default value for all 3 buttons
      trial.button_html_on = Array(3).fill(plugin.info.parameters.button_html_on) 
    } else if (!Array.isArray(trial.button_html_on) | (trial.button_html_on.length !== 1 & trial.button_html_on.length !== 3)) {
      console.error('Error in stripes plugin. button_html_on must be an array with length of either 1 (same HTML string for each button) or 3 (one HTML string per A/X/B button).');
    } else if (trial.button_html_on.length == 1) {
      // if only one value is specified, then use it for all 3 buttons
      trial.button_html_on = Array(3).fill(trial.button_html_on[0])
    } 

    // setup audio_array
    // this should contain the three sound files, in order: A, X and B
    // trial.stimuli[0] is always correct, trial.stimuli[1] and [2] are always incorrect
    audio_array = [];
    if (trial.correct_choice == "A") {
      audio_array.push(trial.stimuli[0]);
      audio_array.push(trial.stimuli[1]);
      audio_array.push(trial.stimuli[2]);
    } else {
      audio_array.push(trial.stimuli[2]);
      audio_array.push(trial.stimuli[1]);
      audio_array.push(trial.stimuli[0]);
    }

    // add the CSS to show the correct/incorrect answer, if show_answer is true
    if (trial.show_answer) {
      if (trial.correct_choice == "A") {
        html += '<style>div#jspsych-audio-button-response-button-0 button {'+trial.answer_correct_style+'} '+
        'div#jspsych-audio-button-response-button-2 button {'+trial.answer_incorrect_style+'}'+
        '</style>';
      } else {
        html += '<style>div#jspsych-audio-button-response-button-0 button {'+trial.answer_incorrect_style+'} '+
        'div#jspsych-audio-button-response-button-2 button {'+trial.answer_correct_style+'}'+
        '</style>';
      }
    }

    // add the audio prompt to the HTML string, if there is one
    if (trial.prompt_audio !== null) {
      html += '<div id="jspsych-stripes-prompt">'+trial.prompt_audio+'</div>';
    }

    // add the audio button HTML to the HTML string
    html += '<div id="jspsych-audio-button-response-btngroup">';
    for (var i = 0; i < trial.choices.length; i++) {
      // create button label using the button_html_off string for this button, and replace the %choice% string with the current choice, if necesssary
      var str = trial.button_html_off[i].replace(/%choice%/g, trial.choices[i]);
      // if this is the reference sound, then add class and disable button 
      if (i == 1) {
        html += '<div class="jspsych-audio-button-response-button jspsych-audio-button-reference" style="cursor: no-cursor; display: inline-block; margin:'+trial.margin_vertical+' '+trial.margin_horizontal+'" id="jspsych-audio-button-response-button-' + i +'" data-choice="'+i+'">'+str+'</div>';
      } else {
        html += '<div class="jspsych-audio-button-response-button" style="cursor: pointer; display: inline-block; margin:'+trial.margin_vertical+' '+trial.margin_horizontal+'" id="jspsych-audio-button-response-button-' + i +'" data-choice="'+i+'">'+str+'</div>';
      }
    }
    html += '</div>';
    
    // add the HTML string to the page
    display_element.innerHTML = html;
    
    // disable the reference button
    display_element.querySelector('.jspsych-audio-button-reference').getElementsByTagName('button')[0].setAttribute('disabled', 'disabled');
    // disable the response buttons if necessary
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

    // object for storing the response information
    var response = {
      rt: null,
      button: null,
      accuracy: null
    };

    // function to handle responses by the subject
    function after_response(choice) {
      // measure rt
      var end_time = performance.now();
      var rt = end_time - start_time;
      response.button = choice;
      response.rt = rt;
      // disable all the buttons after a response
      disable_response_buttons();
      // score response accuracy
      var acc = false;
      if (choice == 0 & trial.correct_choice == "A") {
        acc = true;
      } else if (choice == 2 & trial.correct_choice == "B") {
        acc = true;
      }
      response.accuracy = acc;
      // if response ends trial is true, then either end the trial or show feedback
      if (trial.response_ends_trial) {
        if (trial.show_feedback) {
          show_feedback();
        } else {
          end_trial();
        }
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
        "button_pressed": response.button,
        "accuracy": response.accuracy,
        "density": trial.density,
        "rove": trial.rove,
        "stimuli": trial.stimuli,
        "correct_response": trial.correct_choice
      };
      // clear the display
      display_element.innerHTML = '';
      // move on to the next trial
      jsPsych.finishTrial(trial_data);
    }

    // create the audio onended function (helper function)
    // this function depends on (1) whether the sound is a reference or target, and (2) whether or not it's the last sound
    function create_onended_fn(is_target_sound, is_last_stim) {
      var onended_fn;
      if (is_target_sound) { // audio is one of the choices (A or B)
        if (is_last_stim) { // this is the last audio file
          onended_fn = function() {
            jsPsych.pluginAPI.setTimeout(enable_buttons, trial.stimuli_timing[audio_count+1]);
            change_button_to_audio_off(audio_count-1);
          };
        } else { // not the last stim
          onended_fn = function() {
            jsPsych.pluginAPI.setTimeout(play_next, trial.stimuli_timing[audio_count+1]);
            change_button_to_audio_off(audio_count-1);
          };
        }
      } else { // audio is the reference stim (X)
        onended_fn = function() {
          jsPsych.pluginAPI.setTimeout(play_next, trial.stimuli_timing[audio_count+1]);
          change_button_to_audio_off(audio_count-1);
        };
      }
      return onended_fn; 
    }

    function get_audio_start_time(diff) {
      // TO DO: code here to randomly select from a range of times, based on current density
      var time = 0; // start time is start of the file
      return time;
    }

		// function to start next audio
    function play_next() {
      // is this the 2nd sound file ("target" aka X) or not ("reference" aka 'A' or 'B')?
      var is_target_sound = true;
      if (audio_count === 1) {
        is_target_sound = false;
      }
      // is this the last of the audio choices?
      var is_last_stim = false;
      if (audio_count+1 >= audio_array.length) {
        is_last_stim = true;
      }
      // create the on_ended function for this stim
      var curr_onended_fn = create_onended_fn(is_target_sound, is_last_stim);
      // get the audio file start time, based on current density
      var audio_start_time = get_audio_start_time(trial.density);
      // set up and play next audio 
      if (method == "web_audio") {
        source = context.createBufferSource();
        source.buffer = jsPsych.pluginAPI.getAudioBuffer(audio_array[audio_count]);
        source.connect(context.destination);
        source.onended = curr_onended_fn;
        startTime = context.audio_start_time;
        source.start(startTime);
      } else { // HTML audio
        audio = jsPsych.pluginAPI.getAudioBuffer(audio_array[audio_count]);
        audio.currentTime = audio_start_time;
        audio.addEventListener('ended', curr_onended_fn);
        audio.play();
      }
      // change to the 'audio on' button HTML when sound starts playing
      change_button_to_audio_on(audio_count);
      audio_count++;
    }

    // function to enable the target (A and B) buttons for response and add the response prompt to the screen
    function enable_buttons() {
      var btn_grp = display_element.querySelector("#jspsych-audio-button-response-btngroup");
      btn_grp.classList.remove("no-cursor");
      for (var i = 0; i < trial.choices.length; i++) {
        if (i !== 1) { // don't do this for the 2nd button (reference)
          var curr_btn_div = display_element.querySelector('#jspsych-audio-button-response-button-' + i);
          // add the click event listener
          curr_btn_div.addEventListener('click', function(e) {
            var choice = e.currentTarget.getAttribute('data-choice'); 
            after_response(choice);
          });
          // change button from disabled to enabled
          curr_btn_div.getElementsByTagName('button')[0].disabled = false;
        }
      }
      // replace audio prompt with response prompt
      display_element.querySelector('#jspsych-stripes-prompt').innerHTML = trial.prompt_response;
    }

    // function to disable all response buttons
    function disable_response_buttons() {
      var btns = document.querySelectorAll('.jspsych-audio-button-response-button button');
      for(var i=0; i<btns.length; i++){
        //btns[i].removeEventListener('click');
        btns[i].setAttribute('disabled', 'disabled');
      }
    }

    // functions to change button HTML while sound is playing and not playing
    function change_button_to_audio_on(btn_index) {
      var btn_html_aud_on = trial.button_html_on[btn_index].replace(/%choice%/g, trial.choices[btn_index]);
      var btns = document.querySelectorAll('div.jspsych-audio-button-response-button');
      btns[btn_index].innerHTML = btn_html_aud_on;
      btns[btn_index].getElementsByTagName('button')[0].disabled = true;
    }

    function change_button_to_audio_off(btn_index) {
      var btn_html_aud_off = trial.button_html_off[btn_index].replace(/%choice%/g, trial.choices[btn_index]);
      var btns = document.querySelectorAll('div.jspsych-audio-button-response-button');
      btns[btn_index].innerHTML = btn_html_aud_off;
      btns[btn_index].getElementsByTagName('button')[0].disabled = true;
    }

    function show_feedback() {
      // clear existing timeouts, including the trial duration timeout, if there is one
      jsPsych.pluginAPI.clearAllTimeouts();
      // if no response has been made yet (the feedback was triggered by a trial duration timeout)
      // then disable the response buttons and set accuracy to false
      if (response.rt == null) {
        disable_response_buttons();
        response.accuracy = false;
      }
      // set up feedback text
      var feedback_text = trial.feedback_incorrect_html;
      if (response.accuracy === true) {
        feedback_text = trial.feedback_correct_html;
      }
      // update the page with the feedback text
      display_element.querySelector('#jspsych-stripes-prompt').innerHTML = feedback_text;
      // end the trial after the specified feedback duration
      jsPsych.pluginAPI.setTimeout(end_trial, trial.feedback_duration);
    }

    // end trial or show feedback when the trial duration is reached, if a trial duration is set
    if (trial.trial_duration !== null & trial.show_feedback === false) {
      jsPsych.pluginAPI.setTimeout(end_trial, trial.trial_duration);
    } else if (trial.trial_duration !== null & trial.show_feedback === true) {
      jsPsych.pluginAPI.setTimeout(show_feedback, trial.trial_duration);
    }

    function start_trial() {
      // record trial start time
      start_time = performance.now();
      // start first audio after initial delay
      jsPsych.pluginAPI.setTimeout(play_next, trial.stimuli_timing[0]);
    }

    // The commented-out code below is useful if you need to load the audio at the start of each trial 
    // (instead of preloading at the start of the experiment)
    // because it will check that the page and audio files are ready before starting the trial
    page_ready = true;
     if (audio_ready) {
       start_trial();
     } else {
       // try again?
       console.log('page loaded, audio not ready, attempting to load audio again');
    jsPsych.pluginAPI.preloadAudioFiles(trial.stimuli, change_audio_ready_state);
     }

    // if we're preloading the audio files then we can just start the trial immediately,
    // instead of checking that the page and audio files are ready.
    // start_trial();

  };

  return plugin;
})();
