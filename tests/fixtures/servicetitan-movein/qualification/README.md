# ServiceTitan V2 qualification variations

These authored response pages replace the corresponding base fixture pages in the focused journey. The existing combined provider journey retains its original inputs. No live account export is represented.

The second customer has two Email contacts, one Phone contact and one MobilePhone contact. Each uses only the documented id, customerId, type, value and memo fields. Memos are retained as channel labels; no person name or role is inferred.

The estimate uses the documented V2 status object with integer value and string name (Sold), and estimate items use sku, qty, unitRate and total. The referenced Service and Material SKUs supply their exported taxable flags; estimate item responses have no invented taxable field. The source status is history and never a native customer decision.

A Completed job tests the inherited archive rule. One appointment has no exported assignment; one location names an absent customer and its dependent job is rejected. The syntheticGloveUnknown field deliberately tests retention of an unrecognized field. The missing attachment is a fileName descriptor without downloaded bytes.

Reference: https://developer.servicetitan.io/api-details/ . The generated ServiceTitan client was read through GitHub API for EstimatesV2EstimateResponse, EstimatesV2EstimateItemResponse, EstimatesV2EstimateResponseStatus and EstimatesV2SkuModel; the type shapes are secondary documentation, not a live-provider receipt.
