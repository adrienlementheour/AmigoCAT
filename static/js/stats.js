var Stats=(function($) {
	// Interface
	return {
		summarizeFuzzy : summarizeFuzzy,
		showStats : showStats,
		stats : null
	}
	
	// Implementation
	function summarizeFuzzy(stats) {
		var store, field, findex, fuzzy,
			totals = {
		        'new': 0,
		        'repetitions': 0,
		        'suggestions': 0,
		        'errors': 0,
		        'fuzzy': {
		            '10': 0,
		            '20': 0,
		            '30': 0,
		            '50': 0,
		            '40': 0,
		            '60': 0,
		            '70': 0,
		            '80': 0,
		            '90': 0}
			  };
		for (store in stats) if (stats.hasOwnProperty(store)) {
			fuzzy = stats[store].fuzzy_totals;
			for(field in totals) if (totals.hasOwnProperty(field)) {
				if (field === "fuzzy") {
					for (findex in fuzzy.fuzzy) if (fuzzy.fuzzy.hasOwnProperty(findex)) {
						totals.fuzzy[findex] += parseFloat(fuzzy.fuzzy[findex]);
					}
				} else {
					totals[field] += parseFloat(fuzzy[field]);
				}
			}
		};
		return totals;
	};
	
	function showStats(storeName) {
		var store = storeName || "project",
			stats = Stats.stats[store],
			fuzzy = stats.fuzzy_totals,
			findex, $div;
		
		$("#stats-current-store").html(storeName);
		$('#stats-remain').html(stats.remain);
		$('#stats-finished').html(stats.translated.percentage +"%");
		$('#stats-pending').html(fuzzy.suggestions);
		$('#stats-words-total').html(stats.total.words);
		$('#stats-new-words').html(fuzzy.new);
		$('#stats-spent').html(stats.spent);
		$('#stats-erros').html(fuzzy.errors);
		$('#stats-repetions').html(fuzzy.repetitions);
		
		for (findex in fuzzy.fuzzy) if (fuzzy.fuzzy.hasOwnProperty(findex)) {
			$div = $("#stats-rep-"+findex);
			if ($div.length) $div.html(fuzzy.fuzzy[findex].toString());
		};
	};
})(jQuery);