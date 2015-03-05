'use strict';

// Instance the tour
var tour = new Tour({
  steps: [
    {
      element: '#languageSection',
      title: $Label.Set_Languages_Button,
      content: $Label.Instruction1,
      placement: 'top'
    },
    {
      element: '#recordingButtonPanel',
      title: $Label.Record_Message_Button,
      content: $Label.Instruction4b,
      placement: 'top'
    },
    {
      element: '#chatTitleSection',
      title: $Label.Recording,
      content: $Label.Instruction5,
      placement: 'top'
    }
  ],
  template: '<div class="popover tour-tour tour-tour-0 fade top in" role="tooltip" id="step-0" style="top: 65px; left: 299px; display: block;">'+
  ' <div class="arrow"></div> <h3 class="popover-title"></h3> <div class="popover-content"></div>'+
  ' <div class="popover-navigation"> <div class="btn-group"> <button class="btn btn-sm btn-default" data-role="prev">'+$Label.Prev_Button+'</button>'+
  ' <button class="btn btn-sm btn-default" data-role="next">'+$Label.Next_Button+'</button>  </div> <button class="btn btn-sm btn-default" data-role="end">'+$Label.End_Tour_Button+'</button> </div> </div>',
  storage: false,
  backdrop: true,
  onStart: function (tour) {
    $('#recordingImg').css('display', 'block');
  },
  onEnd: function (tour) {
    $('#recordingImg').css('display', 'none');
  }
});

// Initialize the tour
tour.init();
// Start the tour
tour.start();
