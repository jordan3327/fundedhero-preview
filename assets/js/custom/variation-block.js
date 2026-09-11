jQuery(document).ready(function($) {

    $(document).on('click', '.coupon-code-badge', function(e) {
        e.preventDefault();
        const $badge = $(this);
        const code = $badge.data('code');
        if (!code) return;

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(code);
        } else {
            const $temp = $('<input>');
            $('body').append($temp);
            $temp.val(code).select();
            document.execCommand('copy');
            $temp.remove();
        }

        const originalHTML = $badge.html();
        $badge.addClass('copied').text('Copied!');
        setTimeout(function() {
            $badge.removeClass('copied').html(originalHTML);
        }, 1800);
    });

    $(document).on('click', '.variation-option', function() {
        const $option = $(this);
        const $group = $option.closest('.variation-selector-group');
        const $block = $option.closest('.propfirm-variation-block');

        if ($option.hasClass('disabled')) return;

        $group.find('.variation-option').removeClass('active');
        $option.addClass('active');

        updateVariation($block);
    });

    $('.propfirm-variation-block').each(function() {
        updateVariation($(this));
    });

    function checkOptionsAvailability($block) {
        const jsonContent = $block.find('.variation-data-json').html();
        if (!jsonContent) return;
        
        let variationMap;
        try {
            variationMap = JSON.parse(jsonContent);
        } catch (e) {
            return;
        }

        for (let iter = 0; iter < 5; iter++) {
            let localSelectionChanged = false;

            $block.find('.variation-selector-group').each(function(groupIndex) {
                const $currentGroup = $(this);
                const currentAttr = $currentGroup.data('attribute');
                if (!currentAttr) return;

                const otherSelections = {};
                // Only look at groups that are above the current group in the hierarchy (index < groupIndex)
                $block.find('.variation-selector-group').slice(0, groupIndex).each(function() {
                    const attr = $(this).data('attribute');
                    const $active = $(this).find('.variation-option.active');
                    if (attr && $active.length) {
                        otherSelections[attr.replace(/-/g, '_').toLowerCase()] = $active.data('value');
                    }
                });

                $currentGroup.find('.variation-option').each(function() {
                    const $option = $(this);
                    const optVal = $option.data('value');

                    let isPossible = false;
                    const hypothetical = { ...otherSelections };
                    hypothetical[currentAttr.replace(/-/g, '_').toLowerCase()] = optVal;

                    for (let i = 0; i < variationMap.length; i++) {
                        let v = variationMap[i];
                        if (!v.is_active || !v.is_visible) continue;

                        let match = true;
                        for (let attrName in v.attributes) {
                            let vVal = v.attributes[attrName];
                            let normAttrName = attrName.replace(/-/g, '_').toLowerCase();
                            
                            if (hypothetical[normAttrName] !== undefined) {
                                let normVVal = vVal ? vVal.toString().toLowerCase() : "";
                                let normHypotheticalVal = hypothetical[normAttrName] ? hypothetical[normAttrName].toString().toLowerCase() : "";

                                if (normAttrName === 'variation_tag') {
                                    if (normVVal !== normHypotheticalVal) {
                                        match = false;
                                        break;
                                    }
                                } else {
                                    if (vVal !== "" && normVVal !== normHypotheticalVal) {
                                        match = false;
                                        break;
                                    }
                                }
                            }
                        }
                        if (match) {
                            isPossible = true;
                            break;
                        }
                    }

                    if (isPossible) {
                        $option.removeClass('disabled').show();
                    } else {
                        $option.addClass('disabled').hide();
                        if ($option.hasClass('active')) {
                            $option.removeClass('active');
                            localSelectionChanged = true;
                        }
                    }
                });

                if (!$currentGroup.find('.variation-option.active').length) {
                    const $firstEnabled = $currentGroup.find('.variation-option').not('.disabled').first();
                    if ($firstEnabled.length) {
                        $firstEnabled.addClass('active');
                        localSelectionChanged = true;
                    }
                }
            });

            if (!localSelectionChanged) {
                break;
            }
        }

        $block.find('.variation-selector-group').each(function() {
            const $group = $(this);
            const $visibleOptions = $group.find('.variation-option').not('.disabled');
            if ($visibleOptions.length <= 1) {
                $group.addClass('single-option-group');
            } else {
                $group.removeClass('single-option-group');
            }
        });
    }

    function updateBadges($block) {
        let popularAttrs = $block.attr('data-popular-attributes') || $block.data('popular-attributes');
        let limitedAttrs = $block.attr('data-limited-attributes') || $block.data('limited-attributes');

        if (typeof popularAttrs === 'string') {
            try { popularAttrs = JSON.parse(popularAttrs); } catch(e) { popularAttrs = {}; }
        }
        if (typeof limitedAttrs === 'string') {
            try { limitedAttrs = JSON.parse(limitedAttrs); } catch(e) { limitedAttrs = {}; }
        }

        popularAttrs = popularAttrs || {};
        limitedAttrs = limitedAttrs || {};

        let popularPathMatching = true;
        let limitedPathMatching = true;

        $block.find('.variation-selector-group').each(function(groupIndex) {
            const $group = $(this);
            let rawAttr = ($group.data('attribute') || '').toString();
            let normKey = rawAttr.replace(/-/g, '_').toLowerCase();
            let cleanKey = normKey.replace(/^attribute_/, '');

            let popVal = (popularAttrs[normKey] !== undefined ? popularAttrs[normKey] : (popularAttrs[cleanKey] !== undefined ? popularAttrs[cleanKey] : (popularAttrs[rawAttr] !== undefined ? popularAttrs[rawAttr] : '')));
            let limVal = (limitedAttrs[normKey] !== undefined ? limitedAttrs[normKey] : (limitedAttrs[cleanKey] !== undefined ? limitedAttrs[cleanKey] : (limitedAttrs[rawAttr] !== undefined ? limitedAttrs[rawAttr] : '')));

            if (rawAttr === 'variation_tag') {
                popVal = popularAttrs['variation_tag'] || '';
                limVal = limitedAttrs['variation_tag'] || '';
            }

            const isLevelZero = (groupIndex === 0);

            let allowPopularInGroup = isLevelZero || popularPathMatching;
            let allowLimitedInGroup = isLevelZero || limitedPathMatching;

            $group.find('.variation-option').each(function() {
                const $option = $(this);
                const optVal = ($option.data('value') || '').toString().toLowerCase();
                const rawOptVal = ($option.data('raw-value') || '').toString().toLowerCase();

                let popValNorm = (popVal || '').toString().toLowerCase();
                let limValNorm = (limVal || '').toString().toLowerCase();

                let isPopularOption = allowPopularInGroup && popValNorm !== '' && (optVal === popValNorm || rawOptVal === popValNorm);
                let isLimitedOption = allowLimitedInGroup && limValNorm !== '' && (optVal === limValNorm || rawOptVal === limValNorm) && !isPopularOption;

                // Update Most Popular badge
                if (isPopularOption) {
                    $option.addClass('is-popular');
                    if (!$option.find('.most-popular-badge').length) {
                        $option.prepend(
                            '<span class="most-popular-badge">' +
                                '<svg class="most-popular-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>' +
                                '<span>Most Popular</span>' +
                            '</span>'
                        );
                    }
                } else {
                    $option.removeClass('is-popular');
                    $option.find('.most-popular-badge').remove();
                }

                // Update Limited Time badge
                if (isLimitedOption) {
                    $option.addClass('is-limited-time');
                    if (!$option.find('.limited-time-badge').length) {
                        $option.prepend(
                            '<span class="limited-time-badge">' +
                                '<svg class="limited-time-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>' +
                                '<span>Limited Time</span>' +
                            '</span>'
                        );
                    }
                } else {
                    $option.removeClass('is-limited-time');
                    $option.find('.limited-time-badge').remove();
                }
            });

            // Check active option for this group to update path matching for subsequent groups
            const $activeOption = $group.find('.variation-option.active');
            let activeVal = ($activeOption.data('value') || '').toString().toLowerCase();
            let activeRawVal = ($activeOption.data('raw-value') || '').toString().toLowerCase();

            if (popVal !== '') {
                let popValNorm = popVal.toString().toLowerCase();
                if (activeVal !== popValNorm && activeRawVal !== popValNorm) {
                    popularPathMatching = false;
                }
            } else {
                popularPathMatching = false;
            }

            if (limVal !== '') {
                let limValNorm = limVal.toString().toLowerCase();
                if (activeVal !== limValNorm && activeRawVal !== limValNorm) {
                    limitedPathMatching = false;
                }
            } else {
                limitedPathMatching = false;
            }
        });
    }

    function updateVariation($block) {
        checkOptionsAvailability($block);
        updateBadges($block);

        const jsonContent = $block.find('.variation-data-json').html();
        if (!jsonContent) return;
        
        let variationMap;
        try {
            variationMap = JSON.parse(jsonContent);
        } catch (e) {
            console.error("PropFirm: Invalid Variation JSON", e);
            return;
        }

        const selectedAttributes = {};
        let totalGroups = 0;
        let selectedCount = 0;

        let accountSize = '';
        $block.find('.variation-selector-group').each(function() {
            totalGroups++;
            const attr = $(this).data('attribute'); // e.g. attribute_pa_size
            const $active = $(this).find('.variation-option.active');
            const val = $active.data('value'); // e.g. l
            if (attr && val) {
                selectedAttributes[attr] = val;
                selectedCount++;
                
                if (attr.toLowerCase().indexOf('size') !== -1) {
                    accountSize = $active.text().trim() + ' Account';
                }
            }
        });
        
        $block.find('.selected-account-size').text(accountSize);

        let match = null;

        // Normalize selectedAttributes keys for safe matching
        const normalizedSelected = {};
        for (let key in selectedAttributes) {
            normalizedSelected[key.replace(/-/g, '_').toLowerCase()] = selectedAttributes[key];
        }

        // Only search for a match if all attributes have been selected
        if (selectedCount === totalGroups) {
            for (let i = 0; i < variationMap.length; i++) {
                let v = variationMap[i];
                let isMatch = true;

                for (let attrName in v.attributes) {
                    let vVal = v.attributes[attrName];
                    let normAttrName = attrName.replace(/-/g, '_').toLowerCase();
                    
                    let normVVal = vVal ? vVal.toString().toLowerCase() : "";
                    let normSelectedVal = normalizedSelected[normAttrName] ? normalizedSelected[normAttrName].toString().toLowerCase() : "";

                    // If the variation has a specific value for this attribute (not "Any" -> empty string),
                    // and it doesn't match the user's selection, then this variation doesn't match.
                    if (normAttrName === 'variation_tag') {
                        if (normVVal !== normSelectedVal) {
                            isMatch = false;
                            break;
                        }
                    } else {
                        if (vVal !== "" && normVVal !== normSelectedVal) {
                            isMatch = false;
                            break;
                        }
                    }
                }

                if (isMatch) {
                    match = v;
                    break;
                }
            }
        }

        if (match && match.is_active && match.is_visible) {
            let priceHtml = match.price_html;
            if (!priceHtml || priceHtml.trim() === '') {
                priceHtml = $block.find('.current-price').data('default-price');
            }
            $block.find('.current-price').html(priceHtml);
            $block.find('.selected-variation-id').val(match.id);
            $block.find('.propfirm-buy-now-btn').prop('disabled', false);
            
            updatePhaseTable($block, match.phase_data, match.rules_data);
        } else {
            if (selectedCount < totalGroups) {
                $block.find('.current-price').html('<span class="error">Please select options</span>');
            } else {
                $block.find('.current-price').html('<span class="error">Not available</span>');
            }
            $block.find('.selected-variation-id').val('');
            $block.find('.propfirm-buy-now-btn').prop('disabled', true);
            $block.find('.propfirm-phase-table-container').hide();
        }
    }

    function escapeHtml(value) {
        return String(value === null || value === undefined ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // true sólo si el valor es un número puro ("3000", "4.5"), no "$3,000" ni "4 winning days".
    function isPlainNumber(value) {
        return /^-?\d+(\.\d+)?$/.test(String(value).trim());
    }

    function updatePhaseTable($block, phaseData, rulesData) {
        const $container = $block.find('.propfirm-phase-table-container');
        phaseData = phaseData || {};
        rulesData = rulesData || {};

        if (Object.keys(phaseData).length === 0 && Object.keys(rulesData).length === 0) {
            $container.hide();
            return;
        }

        const phases = {
            'phase_1': 'Phase 1',
            'phase_2': 'Phase 2',
            'phase_3': 'Phase 3',
            'funded': 'Funded'
        };

        // Identify which phases have data
        const activePhases = [];
        ['phase_1', 'phase_2', 'phase_3', 'funded'].forEach(p => {
            if (phaseData[p] && Object.keys(phaseData[p]).length > 0) {
                activePhases.push(p);
            }
        });

        // Default to Phase 1 & Funded if no specific phases configured
        if (activePhases.length === 0) {
            activePhases.push('phase_1', 'funded');
        }

        const colspan = activePhases.length;

        let html = '<table class="propfirm-phase-table">';
        html += '<thead><tr><th></th>';
        activePhases.forEach(p => {
            html += `<th>${phases[p]}</th>`;
        });
        html += '</tr></thead><tbody>';

        // 1. Phase-specific metrics
        const phaseMetrics = {
            'profit_target': 'Profit Target',
            'daily_loss': 'Daily Loss',
            'max_loss': 'Max Loss',
            'min_trading': 'Min Trading Period'
        };

        Object.keys(phaseMetrics).forEach(m => {
            let hasAnyVal = false;
            activePhases.forEach(p => {
                if (phaseData[p] && phaseData[p][m] && phaseData[p][m] !== 'none') {
                    hasAnyVal = true;
                }
            });

            // If metric not set in any phase, skip unless it's daily_loss or max_loss
            if (!hasAnyVal && m !== 'daily_loss' && m !== 'max_loss') {
                return;
            }

            html += `<tr><td class="metric-label">${phaseMetrics[m]}</td>`;
            activePhases.forEach(p => {
                let val = (phaseData[p] && phaseData[p][m] && phaseData[p][m] !== 'none') ? phaseData[p][m] : '-';
                
                // Append % for percentage metrics.
                // Los productos de futuros guardan montos ($3,000), los de forex
                // porcentajes (8). Sólo un número suelto <= 100 es un porcentaje.
                if (val !== '-' && (m === 'profit_target' || m === 'daily_loss' || m === 'max_loss')) {
                    if (isPlainNumber(val) && parseFloat(val) <= 100) {
                        val = val + '%';
                    }
                }

                // Append Day/Days for min_trading.
                // El valor ahora puede ser texto ("4 winning days (0.3% or more)"),
                // que no se debe reescribir como "4 Days".
                if (val !== '-' && m === 'min_trading' && isPlainNumber(val)) {
                    const num = parseFloat(val);
                    val = num + (num === 1 ? ' Day' : ' Days');
                }

                html += `<td>${escapeHtml(val)}</td>`;
            });
            html += '</tr>';
        });

        // Helper for badges
        const renderBadge = (val, isYes) => {
            const cls = isYes ? 'pf-badge-yes' : 'pf-badge-no';
            return `<span class="pf-rule-badge ${cls}">${val}</span>`;
        };

        rulesData = rulesData || {};

        // 2. Drawdown Type
        const drawdownType = (rulesData['drawdown_type'] || 'STATIC').toUpperCase();
        html += `<tr><td class="metric-label">Drawdown Type</td><td colspan="${colspan}" class="cell-highlight"><span class="pf-rule-badge pf-badge-static">${drawdownType}</span></td></tr>`;

        // 3. Consistency Rule
        // Antes era un select YES/NO; ahora admite texto ("50%", "0% Phase 1 / 50% Payout").
        // Se conserva el badge para los valores antiguos.
        const cRaw = (rulesData['consistency'] === undefined || rulesData['consistency'] === null)
            ? 'no'
            : rulesData['consistency'].toString().trim();
        const cLower = cRaw.toLowerCase();
        let consistencyCell;
        if (cRaw === '' || cLower === 'no' || cLower === 'none') {
            consistencyCell = renderBadge('NO', false);
        } else if (cLower === 'yes') {
            consistencyCell = renderBadge('YES', true);
        } else {
            consistencyCell = `<span class="cell-bold">${escapeHtml(cRaw)}</span>`;
        }
        html += `<tr><td class="metric-label">Consistency Rule</td><td colspan="${colspan}">${consistencyCell}</td></tr>`;

        // 4. Profit Split
        const profitSplit = rulesData['profit_split'] || '80% - 90%';
        html += `<tr><td class="metric-label">Profit Split</td><td colspan="${colspan}" class="cell-bold">${escapeHtml(profitSplit)}</td></tr>`;

        // 5. Payout Frequency
        const payoutFreq = rulesData['payout_frequency'] || 'Biweekly (Fast Payout Add-On)';
        html += `<tr><td class="metric-label">Payout Frequency</td><td colspan="${colspan}" class="cell-payout">${escapeHtml(payoutFreq)}</td></tr>`;

        // 6. Addons Available
        const aVal = (rulesData['addons_available'] || 'yes').toString().toLowerCase();
        const isAddonsYes = (aVal === 'yes');
        html += `<tr><td class="metric-label">Add-ons Available</td><td colspan="${colspan}">${renderBadge(isAddonsYes ? 'YES' : 'NO', isAddonsYes)}</td></tr>`;

        // 7. Fee Refund
        const feeRefund = rulesData['fee_refund'] || '100% Refundable';
        html += `<tr><td class="metric-label">Fee Refund</td><td colspan="${colspan}">${escapeHtml(feeRefund)}</td></tr>`;

        // 8. News Trading
        const nVal = (rulesData['news_trading'] || 'yes').toString().toLowerCase();
        const isNewsYes = (nVal !== 'no');
        html += `<tr><td class="metric-label">News Trading</td><td colspan="${colspan}">${renderBadge(isNewsYes ? 'YES' : 'NO', isNewsYes)}</td></tr>`;

        // 9. Weekend Holding
        const wVal = (rulesData['weekend_holding'] || 'yes').toString().toLowerCase();
        const isWeekendYes = (wVal !== 'no');
        html += `<tr><td class="metric-label">Weekend Holding</td><td colspan="${colspan}">${renderBadge(isWeekendYes ? 'YES' : 'NO', isWeekendYes)}</td></tr>`;

        html += '</tbody></table>';
        $container.html(html).show();
    }

    $(document).on('click', '.propfirm-buy-now-btn', function() {
        const $btn = $(this);
        const $block = $btn.closest('.propfirm-variation-block');
        const productId = $block.data('product-id');
        const variationId = parseInt($block.find('.selected-variation-id').val());
        
        const enableCustom = $block.attr('data-enable-custom-buy-now') === 'yes';
        const defaultCustomUrl = $block.attr('data-custom-buy-now-url') || '';

        let targetUrl = '';

        if (enableCustom) {
            const jsonContent = $block.find('.variation-data-json').html();
            let variationMap = [];
            try {
                variationMap = JSON.parse(jsonContent) || [];
            } catch (e) {}

            const match = variationMap.find(v => v.id === variationId);
            if (match && match.custom_buy_now_url) {
                targetUrl = match.custom_buy_now_url;
            } else if (defaultCustomUrl) {
                targetUrl = defaultCustomUrl;
            }
        }

        if (targetUrl) {
            $btn.prop('disabled', true).text('Redirecting...');
            $block.find('.block-loader').show();
            window.location.href = targetUrl;
            return;
        }

        // Build URL
        let url = window.location.origin + window.location.pathname;
        url += '?custom_add_to_cart=' + productId;
        url += '&variation_id=' + variationId;

        $block.find('.variation-selector-group').each(function() {
            const attr = $(this).data('attribute');
            const $active = $(this).find('.variation-option.active');
            let val = $active.data('raw-value');
            if (val === undefined) {
                val = $active.data('value'); // Fallback
            }
            url += '&' + encodeURIComponent(attr) + '=' + encodeURIComponent(val);
        });

        // El cupón que produjo el precio mostrado viaja al checkout. Sin esto
        // el cliente ve un precio rebajado y luego paga el precio completo.
        const couponCode = $block.attr('data-coupon-code') || '';
        if (couponCode) {
            url += '&coupon_code=' + encodeURIComponent(couponCode);
        }

        $btn.prop('disabled', true).text('Redirecting...');
        $block.find('.block-loader').show();

        // Direct redirection
        window.location.href = url;
    });

    // Reset state when page is shown (handles browser back button bfcache)
    window.addEventListener('pageshow', function(event) {
        $('.propfirm-variation-block').each(function() {
            const $block = $(this);
            const $btn = $block.find('.propfirm-buy-now-btn');
            $btn.text('Buy Now');
            $block.find('.block-loader').hide();
            updateVariation($block);
        });
    });
});
